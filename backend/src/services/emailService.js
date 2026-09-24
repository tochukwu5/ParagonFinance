// Loaded dynamically so a missing package disables email rather than
// crashing the server. Notifications are a convenience; the affiliate
// programme works entirely through the admin panel without them.
let resend = null

if (process.env.RESEND_API_KEY) {
  try {
    const { Resend } = await import('resend')
    resend = new Resend(process.env.RESEND_API_KEY)
  } catch {
    console.warn('[email] resend package not installed — email disabled')
  }
}
// Resend's shared sender — works immediately, no DNS. Swap back once
// paragonfinance.xyz is verified under Domains in the Resend dashboard.
const FROM = 'Paragon Finance <onboarding@resend.dev>'
const NOTIFY = process.env.NOTIFY_EMAIL || 'support@paragonfinance.xyz'

async function send(opts) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping send')
    return null
  }
  try {
    return await resend.emails.send({ from: FROM, ...opts })
  } catch (err) {
    // Never throw. Callers are mid-request on something more important.
    console.error('[email] send failed:', err.message)
    return null
  }
}

export function notifyNewApplication(app) {
  const socials = app.socials
    .map(s => `  ${s.platform}: ${s.handle} — ${s.followers.toLocaleString()} followers\n  ${s.url}`)
    .join('\n\n')

  return send({
    to: NOTIFY,
    subject: `Affiliate application — ${app.name}`,
    text: `New affiliate application.

Name:    ${app.name}
Email:   ${app.email}
Wallet:  ${app.walletAddress || 'not provided'}

Socials
${socials}

Audience
${app.audienceDescription || '—'}

Plan
${app.promotionPlan || '—'}

Review: https://www.paragonfinance.xyz/admin
`,
  })
}

export function notifyApplicant(app, decision, note) {
  const approved = decision === 'approved'

  return send({
    to: app.email,
    subject: approved
      ? "You're approved — Paragon Finance affiliate programme"
      : 'Your Paragon Finance affiliate application',
    text: approved
      ? `Hi ${app.name},

You've been approved as a Paragon Finance affiliate.

You now earn 80 points per qualified referral instead of 50, plus 1,000 points once ten of your referrals qualify. A referral qualifies when the person you referred completes three transactions across two separate days.

Your referral link is on your dashboard:
https://www.paragonfinance.xyz/dashboard/referrals

${note ? note + '\n\n' : ''}Thanks for joining.

— Paragon Finance
`
      : `Hi ${app.name},

Thanks for applying to the Paragon Finance affiliate programme. We're not able to approve your application at this time.

${note ? note + '\n\n' : ''}You're welcome to apply again as your audience grows.

You can still refer people and earn 50 points per qualified referral — your link is on your dashboard.

— Paragon Finance
`,
  })
}