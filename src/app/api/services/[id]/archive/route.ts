import { NextResponse } from 'next/server'
export const revalidate = 0
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError } from '@/lib/api'
import { setCors } from '@/lib/cors'
import { apiLimit } from '@/lib/rate-limit'
import { writeAudit } from '@/lib/audit'

function withCors<T extends (...args: any[]) => any>(handler: T): T {
  return (async (...args: any[]) => {
    const res = await handler(...args)
    if (res instanceof Response) Object.entries(setCors()).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }) as T
}

export const POST = withCors(apiLimit(async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { id } = await params

    const service = await db.service.findUnique({ where: { id } })
    if (!service) return err('NOT_FOUND', 404)
    if (service.sellerId !== user.id) return err('FORBIDDEN', 403)

    await db.service.update({
      where: { id },
      data: { status: 'hidden', availability: 'paused', deletedAt: new Date() },
    })

    await writeAudit({ actorId: user.id, action: 'service_archived', entityType: 'service', entityId: id })
    return ok({ success: true })
  } catch (e) {
    return handleError(e)
  }
}))

export const DELETE = withCors(apiLimit(async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { id } = await params

    const service = await db.service.findUnique({ where: { id } })
    if (!service) return err('NOT_FOUND', 404)
    if (service.sellerId !== user.id) return err('FORBIDDEN', 403)

    await db.service.update({
      where: { id },
      data: { status: 'active', availability: 'available', deletedAt: null },
    })

    await writeAudit({ actorId: user.id, action: 'service_restored', entityType: 'service', entityId: id })
    return ok({ success: true })
  } catch (e) {
    return handleError(e)
  }
}))

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: setCors() })
}


export async function GET(req?: Request) {
  if (!req || !req.url || process.env.IS_BUILD_TIME === 'true' || process.env.NEXT_PHASE) return NextResponse.json({ success: true, data: {} })
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 200 })
}
