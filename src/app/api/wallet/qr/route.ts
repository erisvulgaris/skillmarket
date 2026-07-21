import { getCurrentUser } from '@/lib/auth'
import { ok, err, handleError } from '@/lib/api'
import QRCode from 'qrcode'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)

    // QR payload encodes the user id (frontend scanner decodes and routes)
    const payload = JSON.stringify({ t: 'wallet', uid: user.id, u: user.username })
    const dataUrl = await QRCode.toDataURL(payload, {
      width: 320,
      margin: 1,
      color: { dark: '#0a0a0a', light: '#ffffff' },
    })
    return ok({ payload, dataUrl, user: { id: user.id, username: user.username } })
  } catch (e) {
    return handleError(e)
  }
}
