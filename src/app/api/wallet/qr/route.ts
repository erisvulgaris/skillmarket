import { getCurrentUser } from '@/lib/auth'
import { ok, err, handleError } from '@/lib/api'
import { setCors } from '@/lib/cors'
import { apiLimit } from '@/lib/rate-limit'
import QRCode from 'qrcode'

function withCors<T extends (...args: any[]) => any>(handler: T): T {
  return (async (...args: any[]) => {
    const res = await handler(...args)
    if (res instanceof Response) Object.entries(setCors()).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }) as T
}

export const GET = withCors(apiLimit(async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)

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
}))

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: setCors() })
}
