// Combined analysis agent (ANALYSIS.md §2.7).
// Takes a raw_response + its prompt, asks Claude Haiku to extract:
//   - brand mentions (position, strength, sentiment per tracked brand)
//   - untracked brands the AI mentioned
//   - language detection + refusal flag
//   - quality scoring (relevance/specificity/citations/language)
// Persists brand_mentions + response_quality + analysis llm_calls row.

import { brandMentions, db, llmCalls, rawResponses, responseQuality } from '@mentivue/shared/db';
import { callClaude } from '@mentivue/shared/llm';
import { eq, sql } from 'drizzle-orm';
import { getTrackedBrands } from './tracked-brands-cache.ts';

interface AnalysisJson {
  brands_mentioned: Array<{
    brand_slug: string;
    position?: number;
    context?: string;
    mention_strength?: 'primary' | 'secondary' | 'passing';
    sentiment?: 'positive' | 'neutral' | 'negative';
    sentiment_score?: number;
    sentiment_reasoning?: string;
  }>;
  untracked_brands_seen?: string[];
  language_detected?: string;
  refused_to_answer?: boolean;
  quality: {
    score: number;
    relevance?: number;
    specificity?: number;
    citation_quality?: number;
    language_correctness?: number;
    reasoning?: string;
  };
}

export interface AnalysisResult {
  rawResponseId: string;
  llmCallId: string;
  mentionsInserted: number;
  untrackedBrands: string[];
  qualityScore: number;
  refused: boolean;
  languageDetected: string | undefined;
  analysisCostUsd: number;
  analysisLatencyMs: number;
}

export async function analyzeResponse(rawResponseId: string): Promise<AnalysisResult> {
  const raw = await db.query.rawResponses.findFirst({
    where: eq(rawResponses.id, rawResponseId),
    with: { llmCall: { with: { prompt: true } } },
  });
  if (!raw) throw new Error(`raw_response ${rawResponseId} not found`);
  if (!raw.llmCall) throw new Error(`raw_response ${rawResponseId} has no llm_call`);
  if (!raw.llmCall.prompt) throw new Error(`raw_response ${rawResponseId} has no prompt`);

  const promptRecord = raw.llmCall.prompt;
  const verticalId = promptRecord.verticalId;

  const trackedBrands = await getTrackedBrands(verticalId);

  const brandLines = trackedBrands
    .map((b) => `- ${b.slug}: ${[b.name, ...(b.aliases ?? [])].join(', ')}`)
    .join('\n');

  const ANALYSIS_PROMPT = `Si analytik AI search visibility pre slovenský e-commerce trh.
Analyzuj odpoveď AI asistenta na zákaznícku otázku a vráť ŠTRUKTÚROVANÝ výsledok.

TRACKED BRANDS (slug: kanonický názov, aliases):
${brandLines}

ZÁKAZNÍCKA OTÁZKA:
"""
${promptRecord.text}
"""

AI ODPOVEĎ:
"""
${raw.responseText}
"""

Tvoja úloha:
1. Identifikuj všetky tracked brandy spomenuté v AI odpovedi. Porovnávaj voči
   alias-om case-insensitive. Akcent ignoruj. NEvymýšľaj brandy ktoré tam nie sú.
2. Pre každý spomenutý brand urči:
   - position: poradie 1 = prvý spomenutý v texte, 2 = druhý...
   - context: krátky úryvok ±150 znakov okolo zmienky
   - mention_strength: "primary" (hlavné odporúčanie), "secondary" (vedľajšie),
     alebo "passing" (mimochodom v zozname)
   - sentiment: "positive" | "neutral" | "negative"
   - sentiment_score: -1.0 (very negative) až 1.0 (very positive)
   - sentiment_reasoning: 1 veta SK justifikácia
3. untracked_brands_seen: značky spomenuté v texte, ktoré NIE SÚ v tracked liste
   (napr. Euronics, Mediamarkt, Amazon...). Použi originálne názvy ako sa objavili.
4. language_detected: "sk" | "cz" | "en" | "mixed"
5. refused_to_answer: true ak AI sa vyhla odpovedi alebo dala generický disclaimer
6. quality score 0-10 = súčet bodov:
   - relevance (0-3): nakoľko presne rieši otázku
   - specificity (0-3): počet a konkrétnosť spomenutých brandov/produktov
   - citation_quality (0-2): počet a kvalita zdrojov
   - language_correctness (0-2): správna slovenčina
   - reasoning: krátka SK justifikácia (max 150 znakov)

Vráť VÝLUČNE platný JSON, bez markdown, bez textu okolo:

{"brands_mentioned":[{"brand_slug":"alza","position":1,"context":"...","mention_strength":"primary","sentiment":"positive","sentiment_score":0.7,"sentiment_reasoning":"..."}],"untracked_brands_seen":["Euronics"],"language_detected":"sk","refused_to_answer":false,"quality":{"score":8.5,"relevance":3,"specificity":3,"citation_quality":1,"language_correctness":2,"reasoning":"..."}}`;

  const result = await callClaude({
    prompt: ANALYSIS_PROMPT,
    temperature: 0.1,
    maxTokens: 2048,
  });

  // Log the analysis call (provider=anthropic, call_type='analysis')
  const [analysisCall] = await db
    .insert(llmCalls)
    .values({
      promptId: promptRecord.id,
      provider: 'anthropic',
      model: result.model,
      callType: 'analysis',
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cachedInputTokens: result.cachedInputTokens || null,
      estimatedCostUsd: result.costUsd,
      latencyMs: result.latencyMs,
      status: 'success',
      metadata: {
        analyzed_llm_call_id: raw.llmCallId,
        analyzed_raw_response_id: raw.id,
      },
    })
    .returning();

  if (!analysisCall) throw new Error('Failed to insert analysis llm_call');

  // Extract JSON — Claude sometimes wraps in ```json ... ```, so match the first { ... }
  const match = result.text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error(`No JSON found in analysis response: ${result.text.slice(0, 200)}`);
  }
  let parsed: AnalysisJson;
  try {
    parsed = JSON.parse(match[0]);
  } catch (err) {
    throw new Error(`Failed to parse analysis JSON: ${err}. Snippet: ${match[0].slice(0, 200)}`);
  }

  // Insert brand_mentions for any tracked brand the AI named
  const brandBySlug = new Map(trackedBrands.map((b) => [b.slug, b.id]));
  const mentionRows = parsed.brands_mentioned
    .map((m) => {
      const brandId = brandBySlug.get(m.brand_slug);
      if (!brandId) return null;
      return {
        rawResponseId: raw.id,
        brandId,
        position: m.position ?? null,
        context: m.context ?? null,
        mentionStrength: m.mention_strength ?? null,
        sentiment: m.sentiment ?? null,
        sentimentScore: m.sentiment_score ?? null,
        sentimentReasoning: m.sentiment_reasoning ?? null,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  if (mentionRows.length > 0) {
    await db.insert(brandMentions).values(mentionRows);
  }

  // Insert response_quality (one per llm_call)
  await db
    .insert(responseQuality)
    .values({
      llmCallId: raw.llmCallId,
      qualityScore: parsed.quality.score,
      relevance: parsed.quality.relevance ?? null,
      specificity: parsed.quality.specificity ?? null,
      citationQuality: parsed.quality.citation_quality ?? null,
      languageCorrectness: parsed.quality.language_correctness ?? null,
      refused: parsed.refused_to_answer ?? false,
      reasoning: parsed.quality.reasoning ?? null,
    })
    .onConflictDoNothing({ target: responseQuality.llmCallId });

  // Annotate the source llm_call with untracked brands + language
  if ((parsed.untracked_brands_seen?.length ?? 0) > 0 || parsed.language_detected) {
    const extra = JSON.stringify({
      untracked_brands_seen: parsed.untracked_brands_seen ?? [],
      language_detected: parsed.language_detected,
    });
    await db
      .update(llmCalls)
      .set({ metadata: sql`COALESCE(metadata, '{}'::jsonb) || ${extra}::jsonb` })
      .where(eq(llmCalls.id, raw.llmCallId));
  }

  return {
    rawResponseId: raw.id,
    llmCallId: raw.llmCallId,
    mentionsInserted: mentionRows.length,
    untrackedBrands: parsed.untracked_brands_seen ?? [],
    qualityScore: parsed.quality.score,
    refused: parsed.refused_to_answer ?? false,
    languageDetected: parsed.language_detected,
    analysisCostUsd: result.costUsd,
    analysisLatencyMs: result.latencyMs,
  };
}
