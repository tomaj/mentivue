import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { db, brands, prompts, verticals } from './index.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
// __dirname = packages/shared/src/db → repo root is 4 levels up
const repoRoot = resolve(__dirname, '../../../..');

console.log('▸ Seeding initial data…');

// ----------------------------------------------------------------------------
// 1. Vertical: Slovak Electronics
// ----------------------------------------------------------------------------
await db
  .insert(verticals)
  .values({
    slug: 'sk-electronics',
    name: 'Slovak Electronics',
    country: 'SK',
    category: 'electronics',
    language: 'sk',
  })
  .onConflictDoNothing({ target: verticals.slug });

const vertical = await db.query.verticals.findFirst({
  where: (v, { eq }) => eq(v.slug, 'sk-electronics'),
});

if (!vertical) throw new Error('Failed to seed vertical');
console.log(`✓ Vertical: ${vertical.name} (${vertical.slug})`);

// ----------------------------------------------------------------------------
// 2. 15 SK electronics brands (~85 % SK market coverage)
// ----------------------------------------------------------------------------
const brandData: Array<{ slug: string; name: string; website: string; aliases: string[] }> = [
  { slug: 'alza', name: 'Alza.sk', website: 'https://www.alza.sk', aliases: ['Alza', 'alza.sk', 'alza shop'] },
  { slug: 'datart', name: 'Datart', website: 'https://www.datart.sk', aliases: ['Datart', 'datart.sk'] },
  { slug: 'nay', name: 'Nay', website: 'https://www.nay.sk', aliases: ['Nay', 'NAY', 'nay.sk', 'nay elektrodom'] },
  { slug: 'planeo', name: 'Planeo', website: 'https://www.planeo.sk', aliases: ['Planeo', 'Planeo Elektro', 'planeo.sk'] },
  { slug: 'andrea-shop', name: 'Andrea Shop', website: 'https://www.andreashop.sk', aliases: ['Andrea Shop', 'AndreaShop', 'andreashop.sk'] },
  { slug: 'hej-sk', name: 'Hej.sk', website: 'https://www.hej.sk', aliases: ['Hej.sk', 'Hej', 'hejsk'] },
  { slug: 'okay', name: 'Okay', website: 'https://www.okay.sk', aliases: ['Okay', 'OKAY', 'okay.sk', 'okay elektro'] },
  { slug: 'mall', name: 'Mall', website: 'https://www.mall.sk', aliases: ['Mall.sk', 'Mall', 'mall group'] },
  { slug: 'electro-world', name: 'Electro World', website: 'https://www.electroworld.sk', aliases: ['Electro World', 'ElectroWorld', 'ew.sk'] },
  { slug: 'istores', name: 'iStores', website: 'https://www.istores.sk', aliases: ['iStores', 'iStores.sk'] },
  { slug: 'mironet', name: 'Mironet', website: 'https://www.mironet.sk', aliases: ['Mironet', 'mironet.sk'] },
  { slug: 'megapixel', name: 'Megapixel', website: 'https://www.megapixel.sk', aliases: ['Megapixel', 'megapixel.sk'] },
  { slug: 'tpd', name: 'TPD', website: 'https://www.tpd.sk', aliases: ['TPD', 'tpd.sk'] },
  { slug: 'faxcopy', name: 'Faxcopy', website: 'https://www.faxcopy.sk', aliases: ['Faxcopy', 'faxcopy.sk'] },
  { slug: 'notebooky-sk', name: 'Notebooky.sk', website: 'https://www.notebooky.sk', aliases: ['Notebooky.sk', 'Notebooky'] },
];

await db
  .insert(brands)
  .values(brandData.map((b) => ({ ...b, verticalId: vertical.id })))
  .onConflictDoNothing({ target: [brands.verticalId, brands.slug] });

const brandCount = await db.$count(brands);
console.log(`✓ Brands: ${brandCount} total (${brandData.length} seeded)`);

// ----------------------------------------------------------------------------
// 3. First 10 daily prompts from prompts/sk-electronics.yaml
// ----------------------------------------------------------------------------
interface YamlPrompt {
  external_id: string;
  category: string;
  subcategory?: string;
  language: string;
  text: string;
  frequency_tier: 'daily' | 'weekly' | 'monthly';
  is_active: boolean;
}

interface YamlFile {
  metadata: Record<string, unknown>;
  prompts: YamlPrompt[];
}

const yamlPath = resolve(repoRoot, 'prompts/sk-electronics.yaml');
const raw = readFileSync(yamlPath, 'utf-8');
const parsed = yaml.load(raw) as YamlFile;

const sample = parsed.prompts.filter((p) => p.frequency_tier === 'daily' && p.is_active).slice(0, 10);

await db
  .insert(prompts)
  .values(
    sample.map((p) => ({
      verticalId: vertical.id,
      externalId: p.external_id,
      category: p.category,
      subcategory: p.subcategory ?? null,
      language: p.language,
      text: p.text,
      frequencyTier: p.frequency_tier,
      isActive: p.is_active,
    })),
  )
  .onConflictDoNothing({ target: prompts.externalId });

const promptCount = await db.$count(prompts);
console.log(`✓ Prompts: ${promptCount} total (${sample.length} sample of daily tier seeded)`);
console.log('');
console.log('Seed complete. Try a test collection:');
console.log('  cd packages/workers && bun run src/scripts/test-collect.ts');

process.exit(0);
