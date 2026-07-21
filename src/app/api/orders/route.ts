import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody, parsePagination } from '@/lib/api'
import { genOrderNo } from '@/lib/wallet'
import { writeAudit, pushNotification } from '@/lib/audit'
import { z } from 'zod'

const createSchema = z.object({
  serviceId: z.string(),
  packageId: z.string().optional(),
  requirements: z.string().max(2000).optional(),
})

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { skip, limit, page } = parsePagination(req)
    const url = new URL(req.url)
    const role = url.searchParams.get('role') || 'all' // buyer | seller | all
    const status = url.searchParams.get('status')

    const where: any = {}
    if (role === 'buyer') where.buyerId = user.id
    else if (role === 'seller') where.sellerId = user.id
    else where.OR = [{ buyerId: user.id }, { sellerId: user.id }]
    if (status) where.status = status

    const [items, total] = await Promise.all([
      db.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          service: { include: { seller: { include: { profile: true } } } },
          buyer: { include: { profile: true } },
        },
      }),
      db.order.count({ where }),
    ])

    return ok({
      items: items.map((o) => ({
        ...o,
        service: {
          id: o.service.id,
          title: o.service.title,
          price: o.service.price,
        },
        buyer: {
          id: o.buyer.id,
          username: o.buyer.username,
          avatarUrl: o.buyer.profile?.avatarUrl,
        },
        seller: {
          id: o.service.seller.id,
          username: o.service.seller.username,
          avatarUrl: o.service.seller.profile?.avatarUrl,
        },
      })),
      total, page, limit,
    })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { data, error } = await validateBody(createSchema, req)
    if (error) return err(error, 422)

    const service = await db.service.findUnique({
      where: { id: data!.serviceId },
      include: { seller: true, packages: true },
    })
    if (!service) return err('NOT_FOUND', 404)
    if (service.status !== 'active') return err('SERVICE_NOT_AVAILABLE', 400)
    if (service.sellerId === user.id) return err('Cannot buy your own service', 400)

    // Determine price: use package price if packageId provided, else service base price
    let orderPrice = service.price
    let packageId: string | undefined = undefined
    if (data!.packageId) {
      const pkg = service.packages.find((p) => p.id === data!.packageId)
      if (!pkg) return err('Package not found', 404)
      orderPrice = pkg.price
      packageId = pkg.id
    }

    const orderNo = genOrderNo()
    const order = await db.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orderNo,
          buyerId: user.id,
          sellerId: service.sellerId,
          serviceId: service.id,
          packageId,
          price: orderPrice,
          requirements: data!.requirements,
          status: 'pending',
          paymentStatus: 'escrow',
        },
      })
      await tx.orderStatusHistory.create({
        data: { orderId: o.id, status: 'pending', note: 'Order placed' },
      })
      await tx.orderActivity.create({
        data: { orderId: o.id, actorId: user.id, action: 'order_created', detail: 'Order placed' },
      })

      // Create or reuse a conversation for this order
      const existing = await tx.conversation.findFirst({
        where: { orderId: o.id },
      })
      let convoId: string
      if (existing) {
        convoId = existing.id
      } else {
        const convo = await tx.conversation.create({
          data: {
            type: 'order',
            orderId: o.id,
            members: {
              create: [
                { userId: user.id },
                { userId: service.sellerId },
              ],
            },
          },
        })
        convoId = convo.id
      }

      // Escrow payment — inlined to avoid nested transactions
      const buyerWallet = await tx.wallet.findUnique({ where: { userId: user.id } })
      if (!buyerWallet) throw new Error('WALLET_NOT_FOUND')
      if (buyerWallet.frozen) throw new Error('WALLET_FROZEN')
      if (buyerWallet.availableBalance < orderPrice) throw new Error('INSUFFICIENT_BALANCE')

      const updatedWallet = await tx.wallet.update({
        where: { id: buyerWallet.id },
        data: {
          availableBalance: { decrement: orderPrice },
          reservedBalance: { increment: orderPrice },
          lifetimeSpent: { increment: orderPrice },
        },
      })

      const wt = await tx.walletTransaction.create({
        data: {
          walletId: buyerWallet.id,
          type: 'order_payment',
          direction: 'debit',
          amount: orderPrice,
          balanceAfter: updatedWallet.availableBalance,
          referenceId: o.id,
          referenceType: 'order',
          note: 'Escrow for order',
        },
      })

      await tx.ledgerEntry.createMany({
        data: [
          { walletId: buyerWallet.id, entryType: 'debit', account: 'user_wallet', amount: orderPrice, transactionId: wt.id, referenceId: o.id, referenceType: 'order_escrow' },
          { walletId: buyerWallet.id, entryType: 'credit', account: 'escrow', amount: orderPrice, transactionId: wt.id, referenceId: o.id, referenceType: 'order_escrow' },
        ],
      })

      await tx.orderActivity.create({
        data: { orderId: o.id, actorId: user.id, action: 'payment_escrowed', detail: `${service.price} SkillCredits escrowed` },
      })

      return { order: o, conversationId: convoId }
    })

    await pushNotification({
      userId: service.sellerId,
      type: 'order',
      title: 'New order received',
      body: `You received a new order for "${service.title}".`,
      data: { orderId: order.order.id },
    })
    await writeAudit({ actorId: user.id, action: 'order_created', entityType: 'order', entityId: order.order.id })

    return ok({ order: order.order, conversationId: order.conversationId }, 201)
  } catch (e) {
    return handleError(e)
  }
}
