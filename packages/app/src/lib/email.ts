// Email send. Transport priority:
//   1. SMTP_HOST set (dev → Mailpit on localhost:11025, prod → real SMTP)
//   2. RESEND_API_KEY set → Resend HTTP API
//   3. neither → console log (CI / first boot)

import { env } from '@mentivue/shared/config';
import nodemailer from 'nodemailer';

type SendArgs = { to: string; subject: string; html: string; text?: string };
type Result = { ok: true } | { ok: false; error: string };

let cachedTransport: nodemailer.Transporter | null = null;

function getSmtpTransport(): nodemailer.Transporter | null {
  if (!env.SMTP_HOST) return null;
  if (cachedTransport) return cachedTransport;
  cachedTransport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE, // true only for 465; Mailpit uses plain on 1025
    ignoreTLS: !env.SMTP_SECURE, // don't try STARTTLS against Mailpit
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS ?? '' } : undefined,
    tls: { rejectUnauthorized: env.SMTP_SECURE }, // permissive on local
  });
  return cachedTransport;
}

export async function sendEmail(args: SendArgs): Promise<Result> {
  const smtp = getSmtpTransport();
  if (smtp) {
    try {
      const info = await smtp.sendMail({
        from: env.EMAIL_FROM,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      });
      console.log(`📧 [SMTP] ${args.to} — "${args.subject}" — ${info.messageId}`);
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`📧 SMTP send failed: ${msg}`);
      return { ok: false, error: msg };
    }
  }

  if (env.RESEND_API_KEY) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10_000);
    try {
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
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `Resend ${res.status}: ${body}` };
      }
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `Resend fetch failed: ${msg}` };
    } finally {
      clearTimeout(timer);
    }
  }

  // Final fallback: console log so dev flows don't break when no transport is configured
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📧 [CONSOLE] Email to ${args.to}`);
  console.log(`   Subject: ${args.subject}`);
  if (args.text) console.log(`   ${args.text.split('\n').slice(0, 4).join('\n   ')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  return { ok: true };
}

// Re-export templates so callers can do: import { magicLinkEmail, sendEmail } from './email'
export {
  magicLinkEmail,
  passwordResetEmail,
  reportReadyEmail,
  signupApprovedEmail,
  signupNotificationEmail,
  signupReceivedEmail,
} from './email-templates.ts';
