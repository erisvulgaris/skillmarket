import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError } from '@/lib/api'
import { releaseEscrow, refundEscrow } from '@/lib/wallet'
import { pushNotification } from '@/lib/audit'

async function getOrder(id: string) {
  return db.order.findUnique({
    where: { id },
    include: { service: true },
  })
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { id } = await params
    const order = await db.order.findUnique({
      where: { id },
      include: {
        service: { include: { seller: { include: { profile: true } } } },
        buyer: { include: { profile: true } },
        seller: { include: { profile: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        activities: { orderBy: { createdAt: 'asc' } },
        attachments: true,
        reviews: true,
        dispute: true,
      },
    })
    if (!order) return err('NOT_FOUND', 404)
    if (order.buyerId !== user.id && order.sellerId !== user.id && user.role !== 'admin') {
      return err('FORBIDDEN', 403)
    }
    return ok({ order })
  } catch (e) {
    return handleError(e)
  }
}

// Accept order (seller)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { id } = await params
    const url = new URL(req.url)
    const action = url.searchParams.get('action') // accept | deliver | complete | cancel

    const order = await getOrder(id)
    if (!order) return err('NOT_FOUND', 404)

    if (action === 'accept') {
      if (order.sellerId !== user.id) return err('FORBIDDEN', 403)
      if (order.status !== 'pending') return err('Invalid order state', 400)
      const updated = await db.$transaction(async (tx) => {
        const o = await tx.order.update({
          where: { id },
          data: { status: 'in_progress', acceptedAt: new Date() },
        })
        await tx.orderStatusHistory.create({ data: { orderId: id, status: 'in_progress', note: 'Accepted by seller' } })
        await tx.orderActivity.create({ data: { orderId: id, actorId: user.id, action: 'order_accepted' } })
        return o
      })
      await pushNotification({ userId: order.buyerId, type: 'order', title: 'Order accepted', body: `Your order for "${order.service.title}" was accepted.`, data: { orderId: id } })
      return ok({ order: updated })
    }

    if (action === 'deliver') {
      if (order.sellerId !== user.id) return err('FORBIDDEN', 403)
      if (order.status !== 'in_progress') return err('Invalid order state', 400)
      const body = await req.json().catch(() => ({}))
      const updated = await db.$transaction(async (tx) => {
        const o = await tx.order.update({
          where: { id },
          data: { status: 'delivered', deliveredAt: new Date() },
        })
        await tx.orderStatusHistory.create({ data: { orderId: id, status: 'delivered', note: body.note || 'Delivered' } })
        await tx.orderActivity.create({ data: { orderId: id, actorId: user.id, action: 'order_delivered', detail: body.note } })
        if (body.attachmentUrl) {
          await tx.orderAttachment.create({ data: { orderId: id, url: body.attachmentUrl, filename: body.filename || 'deliverable', fileType: body.fileType || 'file', uploadedBy: user.id } })
        }
        return o
      })
      await pushNotification({ userId: order.buyerId, type: 'order', title: 'Order delivered', body: `Your order for "${order.service.title}" was delivered. Review and approve.`, data: { orderId: id } })
      return ok({ order: updated })
    }

    if (action === 'complete') {
      if (order.buyerId !== user.id) return err('FORBIDDEN', 403)
      if (order.status !== 'delivered') return err('Invalid order state', 400)
      const updated = await db.$transaction(async (tx) => {
        const o = await tx.order.update({
          where: { id },
          data: { status: 'completed', completedAt: new Date(), paymentStatus: 'released' },
        })
        await tx.orderStatusHistory.create({ data: { orderId: id, status: 'completed', note: 'Approved by buyer' } })
        await tx.orderActivity.create({ data: { orderId: id, actorId: user.id, action: 'order_completed' } })
        await tx.service.update({ where: { id: order.serviceId }, data: { completedOrders: { increment: 1 } } })
        return o
      })
      // Release escrow
      await releaseEscrow({ orderId: id, buyerId: order.buyerId, sellerId: order.sellerId, amount: order.price })
      await pushNotification({ userId: order.sellerId, type: 'payment', title: 'Payment released', body: `${order.price} SkillCredits released for "${order.service.title}".`, data: { orderId: id } })
      return ok({ order: updated })
    }

    if (action === 'cancel') {
      if (order.buyerId !== user.id && order.sellerId !== user.id) return err('FORBIDDEN', 403)
      if (!['pending', 'in_progress'].includes(order.status)) return err('Invalid order state', 400)
      const updated = await db.$transaction(async (tx) => {
        const o = await tx.order.update({
          where: { id },
          data: { status: 'cancelled', cancelledAt: new Date(), paymentStatus: 'refunded' },
        })
        await tx.orderStatusHistory.create({ data: { orderId: id, status: 'cancelled', note: 'Cancelled' } })
        await tx.orderActivity.create({ data: { orderId: id, actorId: user.id, action: 'order_cancelled' } })
        return o
      })
      // Refund escrow
      await refundEscrow({ orderId: id, buyerId: order.buyerId, amount: order.price })
      await pushNotification({ userId: order.sellerId, type: 'order', title: 'Order cancelled', body: `Order for "${order.service.title}" was cancelled.`, data: { orderId: id } })
      return ok({ order: updated })
    }

    return err('Unknown action', 400)
  } catch (e) {
    return handleError(e)
  }
}
