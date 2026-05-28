import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${BASE_URL}/api/auth/verify?token=${token}`

  await getResend().emails.send({
    from: 'Our Town <noreply@thisisourtown.town>',
    to,
    subject: 'Verify your email — This Is Our Town',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 40px;">🌳</span>
          <h1 style="font-size: 22px; color: #2d2d2d; margin: 8px 0 4px;">Welcome to Our Town</h1>
          <p style="color: #888; font-size: 14px; margin: 0;">Verify your email to get started</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}"
             style="display: inline-block; background: #4a9a38; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
            Verify my email
          </a>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center;">
          If you didn't create an account, you can ignore this email.
        </p>
      </div>
    `,
  })
}
