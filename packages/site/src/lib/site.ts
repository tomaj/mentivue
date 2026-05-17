/**
 * Central site configuration — single source of truth for branding,
 * canonical URL, social handles, and default Open Graph / structured data.
 * Imported by BaseLayout and any page that emits JSON-LD.
 */

export const SITE = {
  /** Canonical origin without trailing slash. Override via Astro.config `site`. */
  origin: 'https://mentivue.sk',
  name: 'Mentivue',
  legalName: 'Mentivue s.r.o.',
  brandShort: 'mentivue',
  locale: 'sk_SK',
  langCode: 'sk',
  country: 'SK',

  defaultTitle: 'Mentivue — čo AI hovorí o vašej značke',
  titleTemplate: '%s — Mentivue',
  defaultDescription:
    'Týždenne meriame ako ChatGPT, Claude, Perplexity a Gemini odpovedajú na nákupné otázky vašich zákazníkov. Pre marketingových lídrov, ktorí už nečítajú SERP.',

  /** 1200×630 PNG sitting in /public. */
  defaultOgImage: '/og-default.png',
  themeColor: '#F7F4ED',

  /** Mailto + social */
  email: 'tomas@mentivue.sk',
  social: {
    linkedin: 'https://www.linkedin.com/company/mentivue',
    x: 'https://x.com/mentivue',
  },
  twitterHandle: '@mentivue',

  /** Foundation date / location for Organization JSON-LD. */
  founded: '2026-01-01',
  founder: 'Tomáš H.',
  addressLocality: 'Bratislava',
  addressCountry: 'SK',
} as const;

/** Absolute URL helper — turns `/foo` into `https://mentivue.sk/foo`. */
export function absoluteUrl(path: string): string {
  if (path.startsWith('http')) return path;
  if (!path.startsWith('/')) return `${SITE.origin}/${path}`;
  return `${SITE.origin}${path}`;
}

/** Build a page title with the site suffix unless caller passed a full title. */
export function pageTitle(title?: string): string {
  if (!title) return SITE.defaultTitle;
  if (title.includes(SITE.brandShort) || title.includes(SITE.name)) return title;
  return SITE.titleTemplate.replace('%s', title);
}

/** Build the Organization JSON-LD blob (site-wide). */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE.origin}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.origin,
    logo: absoluteUrl('/mentivue-logo.svg'),
    image: absoluteUrl(SITE.defaultOgImage),
    foundingDate: SITE.founded,
    founders: [{ '@type': 'Person', name: SITE.founder }],
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.addressLocality,
      addressCountry: SITE.addressCountry,
    },
    sameAs: [SITE.social.linkedin, SITE.social.x],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: SITE.email,
      areaServed: 'SK',
      availableLanguage: ['sk', 'en'],
    },
    description: SITE.defaultDescription,
  } as const;
}

/** Build the WebSite JSON-LD blob (site-wide). */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.origin}/#website`,
    url: SITE.origin,
    name: SITE.name,
    inLanguage: SITE.langCode,
    publisher: { '@id': `${SITE.origin}/#organization` },
    description: SITE.defaultDescription,
  } as const;
}
