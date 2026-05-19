// Four transactional email templates. Each returns { subject, html, text }.
// Compose body strings before passing into renderEmailShell; HTML is otherwise
// trusted (we control the templates).

import { type EmailCalloutRow, escapeHtml, renderEmailShell } from './email-shell.ts';

type Result = { subject: string; html: string; text: string };

function firstName(fullName: string | null | undefined, fallback: string): string {
  if (!fullName) return fallback;
  const parts = fullName.trim().split(/\s+/);
  return parts[0] ?? fallback;
}

// ============================================================================
// 1. MAGIC LINK — login + post-approval first login
// ============================================================================
export function magicLinkEmail(args: {
  recipientName: string | null;
  recipientEmail: string;
  magicUrl: string;
  ttlMinutes?: number;
}): Result {
  const name = firstName(args.recipientName, 'tam');
  const ttl = args.ttlMinutes ?? 15;
  const callout: EmailCalloutRow[] = [
    { label: 'Účet', value: args.recipientEmail },
    { label: 'Platnosť odkazu', value: `${ttl} minút` },
    {
      label: 'Generované',
      value: new Date().toLocaleString('sk-SK', { dateStyle: 'medium', timeStyle: 'short' }),
    },
  ];
  const html = renderEmailShell({
    preheader: `Prihlasovací odkaz pre Mentivue · platí ${ttl} minút`,
    eyebrow: 'Mentivue · prihlásenie',
    heroHtml: `Vitajte späť, ${escapeHtml(name)}.<br/><em style="font-style:italic;color:#FF5B3A;font-weight:500;">Otvorte si dashboard.</em>`,
    bodyHtml: `
      <p style="margin:0 0 18px 0;">Vyžiadali ste si prihlasovací odkaz do Mentivue. Kliknutím nižšie sa prihlásite — žiadne heslo netreba.</p>
      <p style="margin:0 0 18px 0;">Ak ste o prihlásenie nepožiadali, tento e-mail môžete ignorovať.</p>
    `,
    callout: { label: 'Prihlasovací odkaz', rows: callout },
    primaryCta: { url: args.magicUrl, label: 'Prihlásiť sa do Mentivue' },
    postCtaHtml: `Ak tlačidlo nefunguje, skopírujte odkaz do prehliadača: <span style="font-family:'JetBrains Mono',monospace;color:#0E1116;word-break:break-all;">${escapeHtml(args.magicUrl)}</span>`,
  });
  const text = `Vitajte späť, ${name}.\n\nPrihlasovací odkaz (platí ${ttl} minút):\n${args.magicUrl}\n\nAk ste o prihlásenie nepožiadali, ignorujte tento e-mail.`;
  return { subject: 'Prihlásenie do Mentivue', html, text };
}

// ============================================================================
// 2. SIGNUP RECEIVED — confirmation to the applicant after POST /signup
// ============================================================================
export function signupReceivedEmail(args: {
  applicantName: string;
  applicantEmail: string;
  company: string;
}): Result {
  const name = firstName(args.applicantName, 'tam');
  const html = renderEmailShell({
    preheader: 'Vaša žiadosť o prístup do Mentivue je v rade · ozveme sa do 2 prac. dní',
    eyebrow: 'Mentivue · Žiadosť prijatá',
    heroHtml: `Ďakujeme, ${escapeHtml(name)}.<br/><em style="font-style:italic;color:#FF5B3A;font-weight:500;">Ozveme sa do 2 dní.</em>`,
    bodyHtml: `
      <p style="margin:0 0 18px 0;">Vašu žiadosť o prístup do <strong style="color:#0E1116;">Mentivue</strong> sme prijali. Každú žiadosť kontrolujeme osobne, aby zostalo Vlna I exkluzívne.</p>
      <p style="margin:0 0 18px 0;">Pri schválení dostanete <strong style="color:#0E1116;">magic link</strong> na e-mail, ktorý vás okamžite prihlási do dashboardu. Ak by sme niečo potrebovali doplniť, odpoviem osobne.</p>
    `,
    callout: {
      label: 'Vaša žiadosť',
      rows: [
        { label: 'Žiadateľ', value: args.applicantName },
        { label: 'Firma', value: args.company },
        { label: 'E-mail', value: args.applicantEmail },
        { label: 'Stav', value: 'Na schválenie' },
      ],
    },
    secondaryCta: {
      url: 'https://mentivue.sk/methodology',
      label: 'Medzitým: prečítajte metodológiu',
    },
    postCtaHtml: `Ak otázku, napíšte mi priamo na <a class="in-text" href="mailto:tomas@mentivue.sk" style="color:#0E1116;border-bottom:1px solid #FF5B3A;text-decoration:none;">tomas@mentivue.sk</a>.`,
  });
  const text = `Ďakujeme, ${name}.\n\nVašu žiadosť o prístup do Mentivue sme prijali. Pri schválení dostanete magic link na váš e-mail.\n\nŽiadosť: ${args.applicantName} · ${args.company} · ${args.applicantEmail}\n\nOzveme sa do 2 pracovných dní.\n\nTomáš Majer\nMentivue`;
  return { subject: 'Mentivue · vaša žiadosť o prístup je v rade', html, text };
}

// ============================================================================
// 3. SIGNUP APPROVED — welcome with magic link after admin approval
// ============================================================================
export function signupApprovedEmail(args: {
  recipientName: string;
  recipientEmail: string;
  brandName: string | null;
  magicUrl: string;
}): Result {
  const name = firstName(args.recipientName, 'tam');
  const brand = args.brandName ?? '—';
  const html = renderEmailShell({
    preheader: 'Váš prístup do Mentivue je schválený · dashboard čaká',
    eyebrow: 'Mentivue · Vitajte vo Vlne I',
    heroHtml: `Vitajte, ${escapeHtml(name)}.<br/><em style="font-style:italic;color:#FF5B3A;font-weight:500;">Dashboard vás čaká.</em>`,
    bodyHtml: `
      <p style="margin:0 0 18px 0;">Vaša žiadosť bola schválená. Otvorte si svoj <strong style="color:#0E1116;">${escapeHtml(brand === '—' ? 'klientsky dashboard' : `dashboard pre ${brand}`)}</strong> — uvidíte Mentivue Index, 30-dňový SoV trend, sentiment naprieč 4 AI engiami a posledné anomálie.</p>
      <p style="margin:0 0 18px 0;">Prvý <strong style="color:#0E1116;">Pulse newsletter</strong> dostanete najbližší štvrtok ráno. Prvý <strong style="color:#0E1116;">Action Report</strong> bude pripravený do 30 dní.</p>
    `,
    callout: {
      label: 'Váš účet',
      rows: [
        { label: 'Účet', value: args.recipientEmail },
        { label: 'Sledovaná značka', value: brand },
        { label: 'Plán', value: 'Pro' },
        { label: 'Aktualizácie', value: 'Denne · 09:00 SEČ' },
      ],
    },
    primaryCta: { url: args.magicUrl, label: 'Otvoriť dashboard' },
    postCtaHtml:
      'Odkaz vás prihlási bez hesla. Po prvom prihlásení si v Nastaveniach môžete heslo nastaviť.',
  });
  const text = `Vitajte, ${name}.\n\nVaša žiadosť bola schválená. Otvorte si dashboard:\n${args.magicUrl}\n\nÚčet: ${args.recipientEmail}\nSledovaná značka: ${brand}\n\nPrvý Pulse newsletter dostanete najbližší štvrtok. Action Report do 30 dní.\n\nTomáš Majer\nMentivue`;
  return {
    subject: `Mentivue · prístup schválený${args.brandName ? ` · ${args.brandName}` : ''}`,
    html,
    text,
  };
}

// ============================================================================
// 5. REPORT READY — admin approved a generated report; klient gets download link
// ============================================================================
const REPORT_LABEL: Record<string, string> = {
  pulse: 'Pulse newsletter',
  action: 'Action Report',
  audit: 'Per-Brand Audit',
  industry: 'Industry Report',
};

export function reportReadyEmail(args: {
  recipientName: string | null;
  recipientEmail: string;
  brandName: string | null;
  reportType: string;
  periodLabel: string;
  downloadUrl: string;
  pages?: number;
}): Result {
  const name = firstName(args.recipientName, 'tam');
  const typeLabel = REPORT_LABEL[args.reportType] ?? args.reportType;
  const brand = args.brandName ?? '—';
  const html = renderEmailShell({
    preheader: `Váš ${typeLabel} za ${args.periodLabel} je pripravený · stiahnuť`,
    eyebrow: `Mentivue · ${typeLabel}`,
    heroHtml: `${escapeHtml(typeLabel)} <em style="font-style:italic;color:#FF5B3A;font-weight:500;">je pripravený.</em>`,
    bodyHtml: `
      <p style="margin:0 0 18px 0;">${escapeHtml(name)}, váš ${escapeHtml(typeLabel)} za obdobie <strong style="color:#0E1116;">${escapeHtml(args.periodLabel)}</strong> je hotový a schválený.</p>
      <p style="margin:0 0 18px 0;">Otvorte si ho cez tlačidlo nižšie — odporúčame pred prečítaním stiahnuť ako PDF (Cmd/Ctrl+P → Save as PDF) pre offline archív.</p>
    `,
    callout: {
      label: 'Tento report',
      rows: [
        { label: 'Typ', value: typeLabel },
        { label: 'Značka', value: brand },
        { label: 'Obdobie', value: args.periodLabel },
        ...(args.pages ? [{ label: 'Strán', value: String(args.pages) }] : []),
        {
          label: 'Doručené',
          value: new Date().toLocaleDateString('sk-SK', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        },
      ],
    },
    primaryCta: { url: args.downloadUrl, label: 'Otvoriť report' },
    postCtaHtml:
      'Report je vám k dispozícii do konca platnosti predplatného. Vždy ho nájdete aj v dashboarde pod záložkou Reporty.',
  });
  const text = `${name}, váš ${typeLabel} za ${args.periodLabel} je pripravený.\n\nOtvorenie: ${args.downloadUrl}\n\nZnačka: ${brand}\n\nMentivue`;
  return { subject: `Mentivue · ${typeLabel} · ${args.periodLabel}`, html, text };
}

// ============================================================================
// 4. PASSWORD RESET — admin-initiated reset; sends temp password to klient
// ============================================================================
export function passwordResetEmail(args: {
  recipientName: string | null;
  recipientEmail: string;
  tempPassword: string;
  loginUrl: string;
}): Result {
  const name = firstName(args.recipientName, 'tam');
  const html = renderEmailShell({
    preheader: 'Vaše heslo do Mentivue bolo resetované · prihláste sa a zmeňte si ho',
    eyebrow: 'Mentivue · Reset hesla',
    heroHtml: `Vaše heslo bolo resetované, ${escapeHtml(name)}.<br/><em style="font-style:italic;color:#FF5B3A;font-weight:500;">Prihláste sa a zmeňte si ho.</em>`,
    bodyHtml: `
      <p style="margin:0 0 18px 0;">Administrátor Mentivue resetoval vaše heslo. Použite dočasné heslo nižšie pre prihlásenie a v Nastaveniach si nastavte nové.</p>
      <p style="margin:0 0 18px 0;">Ak ste o reset nepožiadali, kontaktujte nás okamžite na <a class="in-text" href="mailto:tomas@mentivue.sk" style="color:#0E1116;border-bottom:1px solid #FF5B3A;text-decoration:none;">tomas@mentivue.sk</a>.</p>
    `,
    callout: {
      label: 'Dočasné prihlásenie',
      rows: [
        { label: 'Účet', value: args.recipientEmail },
        { label: 'Dočasné heslo', value: args.tempPassword },
      ],
    },
    primaryCta: { url: args.loginUrl, label: 'Prihlásiť sa a zmeniť heslo' },
    postCtaHtml: 'Po prihlásení choďte do Nastavenia → Heslo a zmeňte si ho na vlastné.',
  });
  const text = `Vaše heslo bolo resetované, ${name}.\n\nÚčet: ${args.recipientEmail}\nDočasné heslo: ${args.tempPassword}\n\nPrihláste sa: ${args.loginUrl}\nPotom v Nastaveniach zmeňte heslo na vlastné.\n\nAk ste o reset nepožiadali, napíšte na tomas@mentivue.sk.`;
  return { subject: 'Mentivue · vaše heslo bolo resetované', html, text };
}

// ============================================================================
// 5. SIGNUP NOTIFICATION — internal alert to admin when /signup is posted
// ============================================================================
export function signupNotificationEmail(args: {
  applicantName: string;
  applicantEmail: string;
  company: string;
  role: string | null;
  brandSlug: string | null;
  adminUrl: string;
}): Result {
  const html = renderEmailShell({
    preheader: `Nová žiadosť o prístup · ${args.applicantName} · ${args.company}`,
    eyebrow: 'Mentivue · Admin notifikácia',
    heroHtml: `Nová žiadosť: <em style="font-style:italic;color:#FF5B3A;font-weight:500;">${escapeHtml(args.applicantName)}</em>`,
    bodyHtml: `
      <p style="margin:0 0 18px 0;">Čaká na schválenie v <strong style="color:#0E1116;">/admin/klients</strong>.</p>
    `,
    callout: {
      label: 'Detaily žiadosti',
      rows: [
        { label: 'Meno', value: args.applicantName },
        { label: 'E-mail', value: args.applicantEmail },
        { label: 'Firma', value: args.company },
        { label: 'Pozícia', value: args.role ?? '—' },
        { label: 'Značka', value: args.brandSlug ?? '—' },
      ],
    },
    primaryCta: { url: args.adminUrl, label: 'Schváliť v admin paneli' },
  });
  const text = `Nová žiadosť o prístup:\n\n${args.applicantName} (${args.applicantEmail})\n${args.company} · ${args.role ?? '—'}\nZnačka: ${args.brandSlug ?? '—'}\n\nSchváliť: ${args.adminUrl}`;
  return {
    subject: `Mentivue · nová žiadosť · ${args.applicantName} (${args.company})`,
    html,
    text,
  };
}
