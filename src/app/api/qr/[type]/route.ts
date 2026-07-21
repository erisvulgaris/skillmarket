import { db } from '@/lib/db'
import { ok, err, handleError, safeJsonParse } from '@/lib/api'
import QRCode from 'qrcode'

// Generate QR for user / service / wallet
export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return err('id required', 400)

    let payload: any = { type }
    let label = ''

    if (type === 'user') {
      const u = await db.user.findUnique({ where: { id }, include: { profile: true } })
      if (!u) return err('NOT_FOUND', 404)
      payload = { t: 'user', uid: u.id, u: u.username }
      label = u.username
    } else if (type === 'service') {
      const s = await db.service.findUnique({ where: { id } })
      if (!s) return err('NOT_FOUND', 404)
      payload = { t: 'service', sid: s.id, title: s.title }
      label = s.title
    } else if (type === 'wallet') {
      const u = await db.user.findUnique({ where: { id } })
      if (!u) return err('NOT_FOUND', 404)
      payload = { t: 'wallet', uid: u.id, u: u.username }
      label = u.username
    } else {
      return err('Invalid type', 400)
    }

    const dataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
      width: 320,
      margin: 1,
      color: { dark: '#0a0a0a', light: '#ffffff' },
    })
    return ok({ payload, dataUrl, label })
  } catch (e) {
    return handleError(e)
  }
}
