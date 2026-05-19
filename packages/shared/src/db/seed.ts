import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { brands, db, prompts, verticals } from './index.ts';

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
  {
    slug: 'alza',
    name: 'Alza.sk',
    website: 'https://www.alza.sk',
    aliases: ['Alza', 'alza.sk', 'alza shop'],
  },
  {
    slug: 'datart',
    name: 'Datart',
    website: 'https://www.datart.sk',
    aliases: ['Datart', 'datart.sk'],
  },
  {
    slug: 'nay',
    name: 'Nay',
    website: 'https://www.nay.sk',
    aliases: ['Nay', 'NAY', 'nay.sk', 'nay elektrodom'],
  },
  {
    slug: 'planeo',
    name: 'Planeo',
    website: 'https://www.planeo.sk',
    aliases: ['Planeo', 'Planeo Elektro', 'planeo.sk'],
  },
  {
    slug: 'andrea-shop',
    name: 'Andrea Shop',
    website: 'https://www.andreashop.sk',
    aliases: ['Andrea Shop', 'AndreaShop', 'andreashop.sk'],
  },
  {
    slug: 'hej-sk',
    name: 'Hej.sk',
    website: 'https://www.hej.sk',
    aliases: ['Hej.sk', 'Hej', 'hejsk'],
  },
  {
    slug: 'okay',
    name: 'Okay',
    website: 'https://www.okay.sk',
    aliases: ['Okay', 'OKAY', 'okay.sk', 'okay elektro'],
  },
  {
    slug: 'mall',
    name: 'Mall',
    website: 'https://www.mall.sk',
    aliases: ['Mall.sk', 'Mall', 'mall group'],
  },
  {
    slug: 'electro-world',
    name: 'Electro World',
    website: 'https://www.electroworld.sk',
    aliases: ['Electro World', 'ElectroWorld', 'ew.sk'],
  },
  {
    slug: 'istores',
    name: 'iStores',
    website: 'https://www.istores.sk',
    aliases: ['iStores', 'iStores.sk'],
  },
  {
    slug: 'mironet',
    name: 'Mironet',
    website: 'https://www.mironet.sk',
    aliases: ['Mironet', 'mironet.sk'],
  },
  {
    slug: 'megapixel',
    name: 'Megapixel',
    website: 'https://www.megapixel.sk',
    aliases: ['Megapixel', 'megapixel.sk'],
  },
  { slug: 'tpd', name: 'TPD', website: 'https://www.tpd.sk', aliases: ['TPD', 'tpd.sk'] },
  {
    slug: 'faxcopy',
    name: 'Faxcopy',
    website: 'https://www.faxcopy.sk',
    aliases: ['Faxcopy', 'faxcopy.sk'],
  },
  {
    slug: 'notebooky-sk',
    name: 'Notebooky.sk',
    website: 'https://www.notebooky.sk',
    aliases: ['Notebooky.sk', 'Notebooky'],
  },
  // Expansion based on AI-surfaced untracked brands across May 2026 smoke runs
  {
    slug: 'euronics',
    name: 'Euronics',
    website: 'https://www.euronics.sk',
    aliases: ['Euronics', 'EURONICS', 'euronics.sk'],
  },
  {
    slug: 'datacomp',
    name: 'Datacomp',
    website: 'https://www.datacomp.sk',
    aliases: ['Datacomp', 'Datacomp.sk', 'datacomp.sk'],
  },
  {
    slug: 'agem',
    name: 'AGEM Computers',
    website: 'https://www.agem.sk',
    aliases: ['AGEM', 'AGEM Computers', 'agem.sk'],
  },
  { slug: 'emos', name: 'EMOS', website: 'https://www.emos.sk', aliases: ['EMOS', 'emos.sk'] },
  // Comparators & marketplaces that AI repeatedly cites — track as brands so
  // SoV captures "is the AI sending traffic to a comparator instead of an e-shop?"
  {
    slug: 'heureka',
    name: 'Heureka',
    website: 'https://www.heureka.sk',
    aliases: ['Heureka', 'Heureka.sk', 'heureka.sk', 'Heureka.group', 'obchody.heureka.sk'],
  },
  {
    slug: 'pricemania',
    name: 'Pricemania',
    website: 'https://www.pricemania.sk',
    aliases: ['Pricemania', 'pricemania.sk', 'PriceMania'],
  },
  {
    slug: 'najeshopy',
    name: 'NajEshopy',
    website: 'https://www.najeshopy.sk',
    aliases: ['NajEshopy', 'Najeshopy.sk', 'najeshopy.sk'],
  },
  // Cross-border references per PRD §3.4
  {
    slug: 'amazon',
    name: 'Amazon',
    website: 'https://www.amazon.de',
    aliases: ['Amazon', 'amazon.de', 'amazon.com', 'Amazon.de'],
  },
  {
    slug: 'aliexpress',
    name: 'AliExpress',
    website: 'https://aliexpress.com',
    aliases: ['AliExpress', 'Ali Express', 'aliexpress.com', 'Ali'],
  },
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

// Import ALL prompts from the YAML. Insert in batches of 500 to keep
// the prepared statement under Postgres' 65k parameter limit.
const active = parsed.prompts.filter((p) => p.is_active);
const BATCH = 500;
for (let i = 0; i < active.length; i += BATCH) {
  const chunk = active.slice(i, i + BATCH);
  await db
    .insert(prompts)
    .values(
      chunk.map((p) => ({
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
}

const promptCount = await db.$count(prompts);
console.log(`✓ Prompts: ${promptCount} total (${active.length} active in YAML)`);
console.log('');
console.log('Seed complete. Try a test collection:');
console.log('  cd packages/workers && bun run src/scripts/test-collect.ts');

process.exit(0);
