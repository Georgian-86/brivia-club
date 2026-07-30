import nodemailer from 'nodemailer'

// ============================================================
// Transactional email — Gmail SMTP via nodemailer (free tier:
// ~500 recipients/day, plenty for beta). Auth needs a Gmail
// App Password (Google account → 2-Step Verification → App
// passwords), NOT the account password.
// Without SMTP_USER/SMTP_PASS every mail is printed to stdout
// instead, so signup / verify / reset flows stay fully testable
// in dev.
// ============================================================

const { SMTP_USER, SMTP_PASS } = process.env
const FROM =
  process.env.EMAIL_FROM || (SMTP_USER ? `The Brivia Club <${SMTP_USER}>` : 'The Brivia Club <dev@localhost>')

// Gmail: port 465 = implicit TLS. Host/port are overridable so any
// other free SMTP relay drops in without a code change.
const transporter =
  SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 465),
        secure: Number(process.env.SMTP_PORT || 465) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    : null

export async function sendMail({ to, subject, html, text }) {
  if (!transporter) {
    console.log(
      `\n━━━ [mail:dev] → ${to}\n    ${subject}\n${text.replace(/^/gm, '    ')}\n━━━`
    )
    return { id: 'dev-log' }
  }
  return transporter.sendMail({ from: FROM, to, subject, text, html })
}

/**
 * One template for every auth mail — bulletproof <table> layout with
 * inline styles (email clients ignore stylesheets), brand header on
 * dark, white body card, crimson CTA.
 */
export function authEmail({ title, body, ctaLabel, ctaUrl, footnote }) {
  const text = [title, '', body, '', ctaLabel && ctaUrl ? `${ctaLabel}: ${ctaUrl}` : null, footnote]
    .filter(Boolean)
    .join('\n')

  const cta =
    ctaLabel && ctaUrl
      ? `<a href="${ctaUrl}" style="display:inline-block;background:#c8102e;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 28px;border-radius:10px;">${ctaLabel}</a>
         <p style="margin:22px 0 0;font-size:12.5px;color:#a1a1aa;">Or paste this link into your browser:<br><a href="${ctaUrl}" style="color:#c8102e;word-break:break-all;">${ctaUrl}</a></p>`
      : ''

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0b0b0d;border-radius:16px 16px 0 0;">
  <tr><td style="padding:24px 36px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:20px;color:#f4f4f5;">The <span style="color:#ff2740;">B</span>rivia Club</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:0 0 16px 16px;">
  <tr><td style="padding:36px;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
    <h1 style="margin:0 0 14px;font-size:22px;line-height:1.25;color:#141413;">${title}</h1>
    <p style="margin:0 0 26px;font-size:15px;line-height:1.6;color:#52525b;">${body}</p>
    ${cta}
    ${footnote ? `<p style="margin:26px 0 0;padding-top:18px;border-top:1px solid #e4e4e7;font-size:12.5px;line-height:1.5;color:#a1a1aa;">${footnote}</p>` : ''}
  </td></tr>
</table>
<p style="font-family:Arial,sans-serif;font-size:11px;color:#a1a1aa;margin:18px 0 0;">© 2026 The Brivia Club · Swipe. Match. Build.</p>
</td></tr></table></body></html>`

  return { html, text }
}
