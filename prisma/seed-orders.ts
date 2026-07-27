import { PrismaClient } from '@prisma/client'
import { genOrderNo } from '../src/lib/wallet'

const db = new PrismaClient()

async function main() {
  console.log('Seeding order lifecycle data...')

  const buyer = await db.user.findUnique({ where: { username: 'demo_buyer' } })
  const seller = await db.user.findUnique({ where: { username: 'maya_designs' } })
  const admin = await db.user.findUnique({ where: { username: 'admin' } })

  if (!buyer || !seller || !admin) {
    console.error('Run prisma/seed.ts first')
    process.exit(1)
  }

  const services = await db.service.findMany({ where: { sellerId: seller.id } })
  if (services.length === 0) {
    console.error('No services found for seller')
    process.exit(1)
  }

  const now = Date.now()
  const day = 86400000

  const order1 = await db.order.create({
    data: {
      orderNo: genOrderNo(),
      buyerId: buyer.id,
      sellerId: seller.id,
      serviceId: services[0].id,
      price: services[0].price,
      status: 'completed',
      paymentStatus: 'released',
      createdAt: new Date(now - 7 * day),
      acceptedAt: new Date(now - 6 * day),
      deliveredAt: new Date(now - 3 * day),
      completedAt: new Date(now - 2 * day),
    },
  })
  await db.orderStatusHistory.createMany({
    data: [
      { orderId: order1.id, status: 'pending', createdAt: new Date(now - 7 * day) },
      { orderId: order1.id, status: 'in_progress', createdAt: new Date(now - 6 * day) },
      { orderId: order1.id, status: 'delivered', createdAt: new Date(now - 3 * day) },
      { orderId: order1.id, status: 'completed', createdAt: new Date(now - 2 * day) },
    ],
  })
  await db.review.create({
    data: {
      orderId: order1.id,
      serviceId: services[0].id,
      authorId: buyer.id,
      targetId: seller.id,
      rating: 5,
      comment: 'Excellent work! The logo exceeded my expectations.',
      status: 'published',
      images: '[]',
    },
  })

  const order2 = await db.order.create({
    data: {
      orderNo: genOrderNo(),
      buyerId: buyer.id,
      sellerId: seller.id,
      serviceId: services[1].id,
      price: services[1].price,
      status: 'in_progress',
      paymentStatus: 'escrow',
      createdAt: new Date(now - 2 * day),
      acceptedAt: new Date(now - 1 * day),
    },
  })
  await db.orderStatusHistory.createMany({
    data: [
      { orderId: order2.id, status: 'pending', createdAt: new Date(now - 2 * day) },
      { orderId: order2.id, status: 'in_progress', createdAt: new Date(now - 1 * day) },
    ],
  })

  const conversation = await db.conversation.create({
    data: {
      type: 'direct',
      orderId: order2.id,
      members: {
        create: [
          { userId: buyer.id },
          { userId: seller.id },
        ],
      },
    },
  })
  await db.message.createMany({
    data: [
      { conversationId: conversation.id, senderId: seller.id, type: 'text', content: "Hi! I've started working on your brand identity package. Here's a mood board to review.", createdAt: new Date(now - 12 * 3600000) },
      { conversationId: conversation.id, senderId: buyer.id, type: 'text', content: 'Looks great! Love the color direction.', createdAt: new Date(now - 10 * 3600000) },
      { conversationId: conversation.id, senderId: seller.id, type: 'text', content: "Thanks! I'll share the first draft tomorrow.", createdAt: new Date(now - 9 * 3600000) },
    ],
  })

  const order3 = await db.order.create({
    data: {
      orderNo: genOrderNo(),
      buyerId: buyer.id,
      sellerId: seller.id,
      serviceId: services[0].id,
      price: services[0].price,
      requirements: 'I need a modern, minimalist logo for my tech startup. Prefer blue/white color scheme.',
      status: 'pending',
      paymentStatus: 'escrow',
      createdAt: new Date(now - 6 * 3600000),
    },
  })
  await db.orderStatusHistory.create({
    data: { orderId: order3.id, status: 'pending', createdAt: new Date(now - 6 * 3600000) },
  })

  const buyerWallet = await db.wallet.findUnique({ where: { userId: buyer.id } })
  const sellerWallet = await db.wallet.findUnique({ where: { userId: seller.id } })

  if (buyerWallet && sellerWallet) {
    const buyerTx = await db.walletTransaction.create({
      data: {
        walletId: buyerWallet.id,
        type: 'order_payment',
        direction: 'debit',
        amount: order1.price,
        balanceAfter: buyerWallet.availableBalance - order1.price,
        referenceId: order1.id,
        referenceType: 'order',
        note: 'Payment for order',
      },
    })
    const sellerTx = await db.walletTransaction.create({
      data: {
        walletId: sellerWallet.id,
        type: 'order_earnings',
        direction: 'credit',
        amount: order1.price,
        balanceAfter: sellerWallet.availableBalance + order1.price,
        referenceId: order1.id,
        referenceType: 'order',
        note: 'Earnings from completed order',
      },
    })
    // Update actual wallet balances
    await db.wallet.update({ where: { id: buyerWallet.id }, data: { availableBalance: { decrement: order1.price }, reservedBalance: { increment: order1.price } } })
    await db.wallet.update({ where: { id: buyerWallet.id }, data: { reservedBalance: { decrement: order1.price } } })
    await db.wallet.update({ where: { id: sellerWallet.id }, data: { availableBalance: { increment: order1.price }, lifetimeEarned: { increment: order1.price } } })
    // Create corresponding ledger entries for double-entry integrity
    await db.ledgerEntry.createMany({
      data: [
        { walletId: buyerWallet.id, entryType: 'debit', account: 'user_wallet', amount: order1.price, transactionId: buyerTx.id, referenceId: order1.id, referenceType: 'order_escrow' },
        { walletId: buyerWallet.id, entryType: 'credit', account: 'escrow', amount: order1.price, transactionId: buyerTx.id, referenceId: order1.id, referenceType: 'order_escrow' },
        { walletId: sellerWallet.id, entryType: 'debit', account: 'escrow', amount: order1.price, transactionId: sellerTx.id, referenceId: order1.id, referenceType: 'order_release' },
        { walletId: sellerWallet.id, entryType: 'credit', account: 'user_wallet', amount: order1.price, transactionId: sellerTx.id, referenceId: order1.id, referenceType: 'order_release' },
      ],
    })
  }

  console.log('✓ Order seed complete')
  console.log(`  Created: ${order1.orderNo} (completed), ${order2.orderNo} (in_progress), ${order3.orderNo} (pending)`)
  console.log(`  Conversation created for ${order2.orderNo} with 3 messages`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
