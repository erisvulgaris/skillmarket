import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { ok, err, handleError, parseJsonBody } from '@/lib/api'
import { clearCategoryCache } from '@/lib/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  return NextResponse.json({ success: false, error: 'METHOD_NOT_ALLOWED' }, { status: 200 })
}

export async function PATCH(req: Request, ctx: any) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return err('UNAUTHORIZED', 401)
    }

    const resolvedParams = await Promise.resolve(ctx?.params)
    const id = resolvedParams?.id
    const body = await parseJsonBody(req)

    const updated = await db.category.update({
      where: { id },
      data: {
        enabled: typeof body.enabled === 'boolean' ? body.enabled : undefined,
        name: body.name || undefined,
        icon: body.icon || undefined,
      },
    })

    clearCategoryCache()

    return ok({ category: updated })
  } catch (e) {
    return handleError(e)
  }
}
