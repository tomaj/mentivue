// Email-safe HTML shell shared by all transactional emails.
// Built from prototype `~/Downloads/mentivue/emails/Master.html`: 600px table layout,
// Outlook-safe inline styles, Fraunces/Inter Tight/JetBrains Mono web fonts (graceful
// fallback to system fonts on clients that strip @import), dark-mode media queries.

const LOGO_SVG_DATA =
  'data:image/svg+xml;utf8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 48 48%22%3E%3Ccircle cx%3D%2224%22 cy%3D%2224%22 r%3D%2222%22 fill%3D%22none%22 stroke%3D%22%230E1116%22 stroke-width%3D%222%22%2F%3E%3Cpath d%3D%22M 6 24 Q 24 6 42 24 Q 24 42 6 24 Z%22 fill%3D%22none%22 stroke%3D%22%230E1116%22 stroke-width%3D%222%22%2F%3E%3Ccircle cx%3D%2224%22 cy%3D%2224%22 r%3D%225%22 fill%3D%22%23FF5B3A%22%2F%3E%3C%2Fsvg%3E';

const FONT_BODY = "'Inter Tight',-apple-system,'Segoe UI',Arial,sans-serif";
const FONT_DISPLAY = "'Fraunces',Georgia,'Times New Roman',serif";
const FONT_MONO = "'JetBrains Mono','Courier New',monospace";

export type EmailCalloutRow = { label: string; value: string };

export type EmailShellArgs = {
  preheader: string; // hidden inbox preview
  eyebrow: string; // mono uppercase strip above hero
  heroHtml: string; // already-formatted display headline (may contain <em>)
  bodyHtml: string; // multi-paragraph body (HTML escaped/composed by template fn)
  callout?: { label: string; rows: EmailCalloutRow[] }; // optional data callout box
  primaryCta?: { url: string; label: string };
  secondaryCta?: { url: string; label: string };
  postCtaHtml?: string; // optional small italic note under CTA
  footerNoteHtml?: string; // extra small text in footer (optional)
};

export function renderEmailShell(a: EmailShellArgs): string {
  const calloutHtml = a.callout
    ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr><td class="container" style="padding:14px 48px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="dm-callout-bg" style="background:#EBE5D7;border:1px solid #0E1116;">
          <tr><td style="padding:20px 24px;">
            <p class="dm-soft" style="margin:0 0 10px 0;font-family:${FONT_MONO};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#1F2429;">
              ● ${escapeHtml(a.callout.label)}
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family:${FONT_BODY};font-size:14px;line-height:1.7;">
              ${a.callout.rows
                .map(
                  (r) => `<tr>
                <td class="dm-callout-text ink-soft" style="color:#1F2429;width:60%;padding:4px 0;">${escapeHtml(r.label)}</td>
                <td class="dm-callout-text ink" style="color:#0E1116;font-family:${FONT_MONO};font-weight:500;text-align:right;padding:4px 0;">${escapeHtml(r.value)}</td>
              </tr>`,
                )
                .join('')}
            </table>
          </td></tr>
        </table>
      </td></tr>
    </table>`
    : '';

  const primaryCtaHtml = a.primaryCta
    ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr><td class="container" style="padding:18px 48px 8px 48px;">
        <a href="${escapeAttr(a.primaryCta.url)}" class="btn-primary" style="background:#FF5B3A;color:#F7F4ED;font-family:${FONT_BODY};font-size:15px;font-weight:500;letter-spacing:0.005em;padding:16px 28px;display:inline-block;text-decoration:none;">
          ${escapeHtml(a.primaryCta.label)} →
        </a>
      </td></tr>
    </table>`
    : '';

  const secondaryCtaHtml = a.secondaryCta
    ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr><td class="container" style="padding:4px 48px 14px 48px;">
        <a href="${escapeAttr(a.secondaryCta.url)}" class="in-text" style="font-family:${FONT_BODY};font-size:13.5px;color:#0E1116;border-bottom:1px solid #FF5B3A;padding-bottom:1px;text-decoration:none;">
          ${escapeHtml(a.secondaryCta.label)} →
        </a>
      </td></tr>
    </table>`
    : '';

  const postCtaHtml = a.postCtaHtml
    ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr><td class="container dm-soft ink-soft" style="padding:4px 48px 16px 48px;font-family:${FONT_BODY};font-size:13px;color:#1F2429;line-height:1.55;font-style:italic;">
        ${a.postCtaHtml}
      </td></tr>
    </table>`
    : '';

  const footerNoteHtml = a.footerNoteHtml
    ? `<p style="margin:0 0 12px 0;">${a.footerNoteHtml}</p>`
    : '';

  return `<!doctype html>
<html lang="sk" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(a.eyebrow)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
  <style>
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background: #F7F4ED; }
    .ink { color: #0E1116; } .ink-soft { color: #1F2429; } .signal { color: #FF5B3A; }
    @media only screen and (max-width: 620px) {
      .wrap { width: 100% !important; }
      .container { padding: 28px 22px !important; }
      .hero h1 { font-size: 28px !important; line-height: 1.12 !important; }
      .pad-outer { padding: 14px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .dm-bg { background: #1A1814 !important; }
      .dm-container { background: #211E1A !important; }
      .dm-text { color: #ECE7DA !important; }
      .dm-soft { color: #BFB9AB !important; }
      .dm-divider { background: #3A3530 !important; }
      .dm-callout-bg { background: #2A2722 !important; border-color: #4A4540 !important; }
      .dm-callout-text { color: #ECE7DA !important; }
    }
    .btn-primary { background: #FF5B3A; color: #F7F4ED; font-family: ${FONT_BODY}; font-size: 15px; font-weight: 500; padding: 16px 28px; display: inline-block; text-decoration: none; }
    a.in-text { color: #0E1116; border-bottom: 1px solid #FF5B3A; padding-bottom: 1px; }
  </style>
</head>
<body class="dm-bg" style="margin:0;padding:0;background:#F7F4ED;font-family:${FONT_BODY};">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(a.preheader)}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="dm-bg" style="background:#F7F4ED;">
    <tr><td align="center" class="pad-outer" style="padding:40px 20px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="wrap" style="width:600px;max-width:600px;">
        <tr><td class="dm-container" style="background:#FFFFFF;">

          <!-- HEADER · logo -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td class="container" style="padding:36px 48px 28px 48px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;line-height:0;font-size:0;">
                    <img src="${LOGO_SVG_DATA}" alt="Mentivue" width="28" height="28" style="display:block;width:28px;height:28px;" />
                  </td>
                  <td class="dm-text ink" style="vertical-align:middle;font-family:${FONT_DISPLAY};font-size:24px;font-weight:500;letter-spacing:-0.025em;color:#0E1116;line-height:1;">mentivue</td>
                </tr>
              </table>
            </td></tr>
            <tr><td class="dm-divider" style="background:#EBE5D7;height:1px;line-height:1px;font-size:1px;">&nbsp;</td></tr>
          </table>

          <!-- EYEBROW -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td class="container dm-soft ink-soft" style="padding:18px 48px 6px 48px;font-family:${FONT_MONO};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#1F2429;">
              ${escapeHtml(a.eyebrow)}
            </td></tr>
          </table>

          <!-- HERO -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td class="container hero" style="padding:16px 48px 8px 48px;">
              <h1 class="dm-text ink" style="margin:0;font-family:${FONT_DISPLAY};font-weight:500;font-size:34px;line-height:1.12;letter-spacing:-0.028em;color:#0E1116;">
                ${a.heroHtml}
              </h1>
            </td></tr>
          </table>

          <!-- BODY -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td class="container dm-soft ink-soft" style="padding:24px 48px 8px 48px;font-family:${FONT_BODY};font-size:16px;line-height:1.55;color:#1F2429;">
              ${a.bodyHtml}
            </td></tr>
          </table>

          ${calloutHtml}
          ${primaryCtaHtml}
          ${secondaryCtaHtml}
          ${postCtaHtml}

          <!-- FOOTER divider -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td class="dm-divider" style="background:#EBE5D7;height:1px;line-height:1px;font-size:1px;padding:24px 48px 0 48px;">&nbsp;</td></tr>
          </table>

          <!-- FOOTER -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td class="container dm-soft ink-soft" style="padding:22px 48px 32px 48px;font-family:${FONT_BODY};font-size:12px;color:#1F2429;line-height:1.6;">
              ${footerNoteHtml}
              <p style="margin:0 0 4px 0;">Mentivue · AI search visibility research · Bratislava</p>
              <p style="margin:0;font-family:${FONT_MONO};font-size:11px;letter-spacing:0.04em;">
                <a class="in-text" href="https://mentivue.sk" style="color:#0E1116;border-bottom:1px solid #FF5B3A;padding-bottom:1px;text-decoration:none;">mentivue.sk</a>
                &nbsp;·&nbsp;
                <a class="in-text" href="mailto:tomas@mentivue.sk" style="color:#0E1116;border-bottom:1px solid #FF5B3A;padding-bottom:1px;text-decoration:none;">tomas@mentivue.sk</a>
              </p>
            </td></tr>
          </table>

        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/&/g, '&amp;');
}

export { escapeHtml };
