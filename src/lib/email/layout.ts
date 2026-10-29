import { absoluteUrl, getSiteUrl } from "@/lib/seo"

/** Public logo used in transactional emails (must be reachable from email clients). */
export const EMAIL_LOGO_PATH = "/teeshogs-logo-black.png"

export function emailLayout(options: {
  title: string
  preview?: string
  bodyHtml: string
}) {
  const site = getSiteUrl()
  const logoUrl = absoluteUrl(EMAIL_LOGO_PATH)
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
  ${options.preview ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(options.preview)}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:28px 28px 16px;border-bottom:1px solid #e4e4e7;">
              <a href="${site}" style="display:inline-block;text-decoration:none;">
                <img
                  src="${logoUrl}"
                  alt="Teeshogs"
                  width="140"
                  height="auto"
                  style="display:block;width:140px;max-width:140px;height:auto;border:0;outline:none;text-decoration:none;"
                />
              </a>
              <h1 style="margin:18px 0 0;font-size:22px;line-height:1.3;font-weight:700;">${escapeHtml(options.title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;font-size:15px;line-height:1.6;color:#3f3f46;">
              ${options.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;border-top:1px solid #e4e4e7;background:#fafafa;font-size:12px;line-height:1.5;color:#71717a;">
              <p style="margin:0;">© ${year} Teeshogs Clothier</p>
              <p style="margin:8px 0 0;"><a href="${site}" style="color:#18181b;">Visit the shop</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

export function formatNairaEmail(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0)
}
