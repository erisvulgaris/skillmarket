import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)

    // Generate a new TOTP secret
    const secret = new OTPAuth.Secret({ size: 20 })
    const totp = new OTPAuth.TOTP({
      issuer: 'SkillMarket',
      label: user.username,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret.base32),
    })

    // Store the secret temporarily (not enabled until verified)
    await db.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret.base32 },
    })

    // Generate QR code for the otpauth URI
    const uri = totp.toString()
    const dataUrl = await QRCode.toDataURL(uri, {
      width: 256,
      margin: 1,
      color: { dark: '#0a0a0a', light: '#ffffff' },
    })

    await writeAudit({ actorId: user.id, action: '2fa_setup_initiated', entityType: 'user', entityId: user.id })

    return ok({
      secret: secret.base32,
      qrUrl: dataUrl,
      uri,
    })
  } catch (e) {
    return handleError(e)
  }
}
