export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { apiLimit } from '@/lib/rate-limit'
import { requireJson } from '@/lib/content-type'
import { z } from 'zod'

const blockSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['block', 'unblock']),
})

export const GET = apiLimit(async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)

    const blocks = await db.userBlock.findMany({
      where: { blockerId: user.id },
      include: { blocked: { select: { id: true, username: true } } },
    })

    return ok({ items: blocks })
  } catch (e) {
    return handleError(e)
  }
})

export const POST = apiLimit(async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)

    const ct = requireJson(req)
    if (ct) return ct
    const { data, error } = await validateBody(blockSchema, req)
    if (error) return err(error, 422)

    const targetId = data!.userId
    const type = data!.type
    if (targetId === user.id) return err('Cannot block yourself', 400)

    const existing = await db.userBlock.findUnique({
      where: { blockerId_blockedId_type: { blockerId: user.id, blockedId: targetId, type } },
    })

    if (!existing) {
      await db.userBlock.create({
        data: { blockerId: user.id, blockedId: targetId, type },
      })
    }

    return ok({ blocked: true, type })
  } catch (e) {
    return handleError(e)
  }
})

export const DELETE = apiLimit(async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)

    const ct = requireJson(req)
    if (ct) return ct
    const { data, error } = await validateBody(blockSchema, req)
    if (error) return err(error, 422)

    const targetId = data!.userId
    const type = data!.type

    await db.userBlock.deleteMany({
      where: { blockerId: user.id, blockedId: targetId, type },
    })

    return ok({ unblocked: true })
  } catch (e) {
    return handleError(e)
  }
})
