// Pricing calculator tests. Exercises the math against a known PRICING table.
// Run: cd packages/app && bun test

import { describe, expect, test } from 'bun:test';
import { calculateCost, PRICING, pricingKey } from '@mentivue/shared/llm/pricing';

describe('pricingKey', () => {
  test('strips ISO date suffix from anthropic models', () => {
    expect(pricingKey('anthropic', 'claude-haiku-4-5-20251001')).toBe('anthropic:claude-haiku-4-5');
  });
  test('passes plain model ids through unchanged', () => {
    expect(pricingKey('openai', 'gpt-5-mini')).toBe('openai:gpt-5-mini');
  });
  test('does not strip non-date trailing numbers', () => {
    expect(pricingKey('google', 'gemini-2.5-flash')).toBe('google:gemini-2.5-flash');
  });
});

describe('calculateCost', () => {
  test('haiku 4.5 — 10k in / 5k out', () => {
    const c = calculateCost('anthropic:claude-haiku-4-5', {
      inputTokens: 10_000,
      outputTokens: 5_000,
    });
    // 10k input @ $1/Mtok = $0.01 ; 5k output @ $5/Mtok = $0.025 → $0.035
    expect(c).toBeCloseTo(0.035, 5);
  });

  test('cached input pays cached rate, billed input is the leftover', () => {
    const c = calculateCost('anthropic:claude-haiku-4-5', {
      inputTokens: 10_000,
      cachedInputTokens: 6_000,
      outputTokens: 0,
    });
    // 4k billed @ $1 = $0.004 ; 6k cached @ $0.1 = $0.0006 → $0.0046
    expect(c).toBeCloseTo(0.0046, 5);
  });

  test('search fee adds per call', () => {
    const base = calculateCost('anthropic:claude-haiku-4-5', { inputTokens: 0, outputTokens: 0 });
    const with2 = calculateCost('anthropic:claude-haiku-4-5', {
      inputTokens: 0,
      outputTokens: 0,
      searchCalls: 2,
    });
    expect(with2 - base).toBeCloseTo(0.01, 5); // 2 × $0.005
  });

  test('gemini flash zero-cached call', () => {
    const c = calculateCost('google:gemini-2.0-flash', {
      inputTokens: 100_000,
      outputTokens: 20_000,
    });
    // 100k @ $0.1 = $0.01 ; 20k @ $0.4 = $0.008 → $0.018
    expect(c).toBeCloseTo(0.018, 5);
  });

  test('unknown model throws', () => {
    expect(() => calculateCost('made-up:not-real', { inputTokens: 1, outputTokens: 1 })).toThrow(
      /Unknown model pricing/,
    );
  });

  test('every PRICING entry calculates without throwing', () => {
    for (const key of Object.keys(PRICING)) {
      const k = key as keyof typeof PRICING;
      expect(() => calculateCost(k, { inputTokens: 1000, outputTokens: 1000 })).not.toThrow();
    }
  });

  test('cached can exceed input → billed input clamps at zero, no negative cost', () => {
    const c = calculateCost('anthropic:claude-haiku-4-5', {
      inputTokens: 5_000,
      cachedInputTokens: 10_000, // more cached than total — degenerate, must not go negative
      outputTokens: 0,
    });
    expect(c).toBeGreaterThanOrEqual(0);
  });
});
