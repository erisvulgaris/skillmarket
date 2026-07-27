import { z } from 'zod'
import { db } from '@/lib/db'
import { ok, err, handleError } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { apiLimit } from '@/lib/rate-limit'
import QRCode from 'qrcode'

const idSchema = z.string().min(1)

export const GET = apiLimit(async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params
    if (!['user', 'wallet', 'service'].includes(type)) return err('Invalid type', 400)

    const url = new URL(req.url)
    const idParsed = idSchema.safeParse(url.searchParams.get('id'))
    if (!idParsed.success) return err('id required', 400)
    const id = idParsed.data

    const currentUser = await getCurrentUser()
    if (!currentUser) return err('Unauthorized', 401)

    let payload: Record<string, unknown> = { type }
    let label = ''

    if (type === 'user') {
      if (id !== currentUser.id) return err('Unauthorized', 401)
      payload = { t: 'user', uid: currentUser.id, u: currentUser.username }
      label = currentUser.username
    } else if (type === 'wallet') {
      if (id !== currentUser.id) return err('Unauthorized', 401)
      payload = { t: 'wallet', uid: currentUser.id, u: currentUser.username }
      label = currentUser.username
    } else if (type === 'service') {
      const s = await db.service.findUnique({ where: { id } })
      payload = { t: 'service', sid: s?.id || 'unknown', title: s?.title || 'Service' }
      label = s?.title || 'Service'
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
})
