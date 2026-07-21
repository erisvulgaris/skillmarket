import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { pushNotification } from '@/lib/audit'
import { z } from 'zod'

const schema = z.object({
  reason: z.string().min(5).max(500),
  detail: z.string().max(2000).optional(),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { id } = await params
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)

    const order = await db.order.findUnique({ where: { id } })
    if (!order) return err('NOT_FOUND', 404)
    if (order.buyerId !== user.id && order.sellerId !== user.id) return err('FORBIDDEN', 403)
    if (!['in_progress', 'delivered'].includes(order.status)) return err('Cannot dispute order in current state', 400)

    const existing = await db.dispute.findUnique({ where: { orderId: id } })
    if (existing) return err('ALREADY_EXISTS', 409)

    const isBuyer = order.buyerId === user.id
    const dispute = await db.$transaction(async (tx) => {
      const d = await tx.dispute.create({
        data: {
          orderId: id,
          claimantId: user.id,
          respondentId: isBuyer ? order.sellerId : order.buyerId,
          reason: data!.reason,
          detail: data!.detail,
          status: 'open',
        },
      })
      await tx.order.update({ where: { id }, data: { status: 'disputed' } })
      await tx.orderStatusHistory.create({
        data: { orderId: id, status: 'disputed', note: data!.reason },
      })
      await tx.orderActivity.create({
        data: { orderId: id, actorId: user.id, action: 'dispute_opened', detail: data!.reason },
      })
      return d
    })

    // Notify respondent and admins
    await pushNotification({
      userId: isBuyer ? order.sellerId : order.buyerId,
      type: 'dispute',
      title: 'Order disputed',
      body: `A dispute was opened for order ${order.orderNo}.`,
      data: { orderId: id, disputeId: dispute.id },
    })
    const admins = await db.user.findMany({ where: { role: 'admin' }, select: { id: true } })
    for (const a of admins) {
      await pushNotification({
        userId: a.id,
        type: 'dispute',
        title: 'New dispute opened',
        body: `Dispute on order ${order.orderNo}: ${data!.reason}`,
        data: { disputeId: dispute.id },
      })
    }

    return ok({ dispute }, 201)
  } catch (e) {
    return handleError(e)
  }
}
