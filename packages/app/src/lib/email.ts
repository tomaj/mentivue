// Email send. In dev (RESEND_API_KEY missing) → log to console.
// In prod → POST to Resend API.

import { env } from '@mentivue/shared/config';

type SendArgs = { to: string; subject: string; html: string; text?: string };

export async function sendEmail(args: SendArgs): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!env.RESEND_API_KEY) {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 [DEV] Email to ${args.to}`);
    console.log(`   Subject: ${args.subject}`);
    if (args.text) console.log(`   ${args.text}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    return { ok: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: `Resend ${res.status}: ${body}` };
  }
  return { ok: true };
}

export function magicLinkEmail(magicUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: 'Prihlásenie do Mentivue',
    text: `Prihlasovací odkaz (platí 15 minút): ${magicUrl}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:540px;margin:0 auto;padding:32px 24px;color:#0E1116">
        <h1 style="font-family:Fraunces,serif;font-weight:500;font-size:24px;margin:0 0 16px">Prihlásenie do Mentivue</h1>
        <p style="font-size:15px;line-height:1.55;margin:0 0 24px">
          Kliknite na odkaz nižšie pre prihlásenie. Platí 15 minút.
        </p>
        <p style="margin:0 0 24px">
          <a href="${magicUrl}" style="display:inline-block;background:#0E1116;color:#F7F4ED;text-decoration:none;padding:12px 20px;font-size:14px;font-weight:500;border-radius:2px">
            Prihlásiť sa
          </a>
        </p>
        <p style="font-size:12px;color:#6B7280;line-height:1.5;margin:24px 0 0">
          Ak ste o prihlásenie nepožiadali, ignorujte tento email. <br>
          Alebo skopírujte odkaz do prehliadača: <br>
          <span style="word-break:break-all;color:#0E1116">${magicUrl}</span>
        </p>
      </div>
    `,
  };
}
