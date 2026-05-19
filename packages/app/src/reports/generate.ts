// Report generation pipeline: load context from DB → run report-specific
// data builder → render HTML → write to packages/app/storage/reports/{id}.html
// → update reports row (status, storage_url, metadata.fileSize).
//
// Storage path is relative to the app's working dir; absolute path is resolved
// from import.meta.url so this works whether app runs from packages/app or repo root.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brands, db, klients, reports, verticals } from '@mentivue/shared/db';
import { eq } from 'drizzle-orm';
import { renderAuditReport } from './audit.tsx';
import { buildAuditData, buildIndustryData, buildMonthlyData, type ReportContext } from './data.ts';
import { renderIndustryReport } from './industry.tsx';
import { renderMonthlyReport } from './monthly.tsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
// packages/app/src/reports → packages/app/storage/reports
const STORAGE_DIR = resolve(__dirname, '../../storage/reports');

export type GenerateResult =
  | { ok: true; filePath: string; storageUrl: string; bytes: number }
  | { ok: false; error: string };

export async function generateReport(reportId: string): Promise<GenerateResult> {
  const report = await db.query.reports.findFirst({ where: eq(reports.id, reportId) });
  if (!report) return { ok: false, error: 'report not found' };

  // Mark as generating so the dashboard reflects status
  await db.update(reports).set({ status: 'generating' }).where(eq(reports.id, reportId));

  try {
    let html: string;
    let titleMeta: string;

    if (report.type === 'industry') {
      if (!report.verticalId) throw new Error('industry report missing vertical_id');
      const vertical = await db.query.verticals.findFirst({
        where: eq(verticals.id, report.verticalId),
      });
      if (!vertical) throw new Error('vertical not found');
      const data = await buildIndustryData(
        vertical.slug,
        {
          start: report.periodStart,
          end: report.periodEnd,
          label: formatPeriodLabel(report.periodStart, report.periodEnd),
        },
        buildRefCode(report.type, report.periodEnd),
      );
      html = renderIndustryReport(data);
      titleMeta = `Mentivue Industry Report · ${vertical.name} · ${data.period.label}`;
    } else {
      // monthly / audit / pulse → need klient + brand
      if (!report.klientId || !report.brandId)
        throw new Error('per-brand report missing klient or brand');
      const [klient, brand] = await Promise.all([
        db.query.klients.findFirst({ where: eq(klients.id, report.klientId) }),
        db.query.brands.findFirst({ where: eq(brands.id, report.brandId) }),
      ]);
      if (!klient || !brand) throw new Error('klient or brand not found');

      const ctx: ReportContext = {
        klient: { id: klient.id, name: klient.name, email: klient.email, company: klient.company },
        brand: { id: brand.id, name: brand.name, slug: brand.slug },
        period: {
          start: report.periodStart,
          end: report.periodEnd,
          label: formatPeriodLabel(report.periodStart, report.periodEnd),
        },
        refCode: buildRefCode(report.type, report.periodEnd, brand.slug),
        generatedAt: new Date(),
      };

      if (report.type === 'action' || report.type === 'pulse') {
        const data = await buildMonthlyData(ctx);
        html = renderMonthlyReport(data);
        titleMeta = `Mentivue Action Report · ${brand.name} · ${ctx.period.label}`;
      } else if (report.type === 'audit') {
        const data = await buildAuditData(ctx);
        html = renderAuditReport(data);
        titleMeta = `Mentivue Per-Brand Audit · ${brand.name} · ${ctx.period.label}`;
      } else {
        throw new Error(`unsupported report type: ${report.type}`);
      }
    }

    // Write to disk
    await mkdir(STORAGE_DIR, { recursive: true });
    const filePath = resolve(STORAGE_DIR, `${reportId}.html`);
    await writeFile(filePath, html, 'utf-8');

    // Update DB row
    const storageUrl = `/app/reports/${reportId}/download`;
    const existingMeta = (report.metadata as Record<string, unknown> | null) ?? {};
    await db
      .update(reports)
      .set({
        status: 'ready',
        storageUrl,
        metadata: {
          ...existingMeta,
          title: titleMeta,
          bytes: html.length,
          generatedAt: new Date().toISOString(),
        },
      })
      .where(eq(reports.id, reportId));

    return { ok: true, filePath, storageUrl, bytes: html.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Report ${reportId} generation failed:`, msg);
    await db.update(reports).set({ status: 'failed' }).where(eq(reports.id, reportId));
    return { ok: false, error: msg };
  }
}

function formatPeriodLabel(start: Date, end: Date): string {
  const startMonth = start.getMonth();
  const _endMonth = end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  // Heuristic: if span is ~30 days → "Month YYYY"; ~90 days → "Q? YYYY"; else date range
  const days = Math.round((end.getTime() - start.getTime()) / 86400000);
  if (days <= 35) {
    return new Intl.DateTimeFormat('sk-SK', { month: 'long', year: 'numeric' }).format(start);
  }
  if (days <= 100 && sameYear) {
    const q = Math.floor(startMonth / 3) + 1;
    return `Q${q} ${start.getFullYear()}`;
  }
  return `${new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'short' }).format(start)} – ${new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'short', year: 'numeric' }).format(end)}`;
}

function buildRefCode(type: string, periodEnd: Date, brandSlug?: string): string {
  const y = periodEnd.getFullYear();
  const m = String(periodEnd.getMonth() + 1).padStart(2, '0');
  const q = Math.floor(periodEnd.getMonth() / 3) + 1;
  const brand = brandSlug ? `-${brandSlug.toUpperCase().slice(0, 4)}` : '';
  if (type === 'action') return `MAR-${y}-${m}${brand}`;
  if (type === 'audit') return `AUD-${y}-Q${q}${brand}`;
  if (type === 'pulse') return `PUL-${y}-${m}${brand}`;
  if (type === 'industry') return `IND-${y}-Q${q}`;
  return `REP-${y}-${m}${brand}`;
}

export function getReportFilePath(reportId: string): string {
  return resolve(STORAGE_DIR, `${reportId}.html`);
}
