import crypto from 'crypto';
import nodemailer, { Transporter } from 'nodemailer';
import { env, isDevelopment } from '../config/env';

export function generateOtp(length = 6): string {
  const max = 10 ** length;
  const n = crypto.randomInt(0, max);
  return n.toString().padStart(length, '0');
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  if (!env.smtp.host || !env.smtp.user) return null;

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
  return transporter;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const t = getTransporter();

  // In dev, if SMTP is not configured, just log and succeed so flows don't break
  if (!t) {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.log('\n📧 [DEV EMAIL]', {
        to: opts.to,
        subject: opts.subject,
        preview: opts.text ?? opts.html.slice(0, 200),
      });
      return;
    }
    throw new Error('SMTP not configured');
  }

  await t.sendMail({
    from: env.smtp.from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}

export function otpEmailHtml(name: string, code: string): string {
  return `
    <div style="font-family: 'DM Sans', system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #fafafa;">
      <div style="background: white; border-radius: 16px; padding: 40px; border: 1px solid #e5e7eb;">
        <h1 style="margin: 0 0 8px; font-size: 24px; color: #111827;">Verify your email</h1>
        <p style="color: #4b5563; margin: 0 0 24px;">Hi ${name}, use this code to verify your FlowBoard account:</p>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #6366f1; background: #eef2ff; padding: 20px; border-radius: 12px; text-align: center;">
          ${code}
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">This code expires in 10 minutes. If you didn't request it, ignore this email.</p>
      </div>
    </div>
  `;
}

export function resetEmailHtml(name: string, link: string): string {
  return `
    <div style="font-family: 'DM Sans', system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #fafafa;">
      <div style="background: white; border-radius: 16px; padding: 40px; border: 1px solid #e5e7eb;">
        <h1 style="margin: 0 0 8px; font-size: 24px; color: #111827;">Reset your password</h1>
        <p style="color: #4b5563;">Hi ${name}, click the button below to reset your FlowBoard password:</p>
        <a href="${link}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin: 16px 0; font-weight: 600;">Reset Password</a>
        <p style="color: #6b7280; font-size: 14px;">This link expires in 1 hour.</p>
      </div>
    </div>
  `;
}
