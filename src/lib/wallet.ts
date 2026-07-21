import { db } from './db'
import { randomBytes } from 'crypto'

// All amounts are integer units of SkillCredits (smallest unit).
// Double-entry: every operation credits one account and debits another so the
// sum of all ledger entries is always zero (platform-wide conservation).

export const PLATFORM_WALLET_KEY = 'platform' // pseudo wallet key for ledger account

type LedgerAccount = 'user_wallet' | 'platform' | 'revenue' | 'escrow' | 'referral_pool'

export function genReceiptNo(prefix = 'TRX'): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = randomBytes(4).toString('hex').toUpperCase()
  return `${prefix}-${ts}-${rand}`
}

export function genOrderNo(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = randomBytes(3).toString('hex').toUpperCase()
  return `ORD-${ts}-${rand}`
}

async function ensureWallet(userId: string) {
  const wallet = await db.wallet.findUnique({ where: { userId } })
  if (wallet) return wallet
  return db.wallet.create({ data: { userId } })
}

interface LedgerInput {
  walletId: string
  entryType: 'debit' | 'credit'
  account: LedgerAccount
  amount: number
  transactionId?: string
  referenceId?: string
  referenceType?: string
}

async function writeLedger(tx: any, entries: LedgerInput[]) {
  for (const e of entries) {
    await tx.ledgerEntry.create({ data: e })
  }
}

// ─── Buy SkillCredits (fiat -> wallet) ─────────────────
export async function purchaseCredits(params: {
  userId: string
  amountCredits: number
  amountFiat: number
  currency?: string
  idempotencyKey: string
  gatewayRef?: string
}) {
  const { userId, amountCredits, amountFiat, currency = 'USD', idempotencyKey, gatewayRef } = params
  if (amountCredits <= 0) throw new Error('INVALID_AMOUNT')

  return db.$transaction(async (tx) => {
    // idempotency: if a purchase with this key exists, return it
    const existing = await tx.creditPurchase.findUnique({ where: { idempotencyKey } })
    if (existing) {
      return { purchase: existing, alreadyExists: true }
    }

    const purchase = await tx.creditPurchase.create({
      data: {
        userId,
        amountCredits,
        amountFiat,
        currency,
        status: 'succeeded',
        gateway: 'internal',
        gatewayRef: gatewayRef || `sim_${idempotencyKey}`,
        idempotencyKey,
        completedAt: new Date(),
      },
    })

    const wallet = await ensureWallet(userId)
    const lockedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { increment: amountCredits },
        lifetimePurchased: { increment: amountCredits },
      },
    })

    const wt = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'purchase',
        direction: 'credit',
        amount: amountCredits,
        balanceAfter: lockedWallet.availableBalance,
        referenceId: purchase.id,
        referenceType: 'credit_purchase',
        note: `Purchased ${amountCredits} SkillCredits`,
      },
    })

    // Double entry: credit user_wallet, debit platform (fiat received externally)
    await writeLedger(tx, [
      { walletId: wallet.id, entryType: 'credit', account: 'user_wallet', amount: amountCredits, transactionId: wt.id, referenceId: purchase.id, referenceType: 'credit_purchase' },
      { walletId: wallet.id, entryType: 'debit', account: 'platform', amount: amountCredits, transactionId: wt.id, referenceId: purchase.id, referenceType: 'credit_purchase' },
    ])

    await tx.auditLog.create({
      data: {
        actorId: userId,
        action: 'credit_purchase',
        entityType: 'wallet',
        entityId: wallet.id,
        after: JSON.stringify({ amountCredits, amountFiat, currency }),
      },
    })

    return { purchase, alreadyExists: false }
  })
}

// ─── Transfer between users ─────────────────────────
export async function transferCredits(params: {
  senderId: string
  receiverId: string
  amount: number
  note?: string
  pinHash?: string | null
  pinProvided?: string
}) {
  const { senderId, receiverId, amount, note } = params
  if (amount <= 0) throw new Error('INVALID_AMOUNT')
  if (senderId === receiverId) throw new Error('CANNOT_TRANSFER_TO_SELF')

  return db.$transaction(async (tx) => {
    const senderWallet = await tx.wallet.findUnique({ where: { userId: senderId } })
    const receiverWallet = await tx.wallet.findUnique({ where: { userId: receiverId } })
    if (!senderWallet) throw new Error('SENDER_WALLET_NOT_FOUND')
    if (!receiverWallet) throw new Error('RECEIVER_WALLET_NOT_FOUND')
    if (senderWallet.frozen) throw new Error('SENDER_WALLET_FROZEN')
    if (receiverWallet.frozen) throw new Error('RECEIVER_WALLET_FROZEN')
    if (senderWallet.availableBalance < amount) throw new Error('INSUFFICIENT_BALANCE')

    // Verify users are active
    const sender = await tx.user.findUnique({ where: { id: senderId } })
    const receiver = await tx.user.findUnique({ where: { id: receiverId } })
    if (!sender || sender.status !== 'active') throw new Error('SENDER_INACTIVE')
    if (!receiver || receiver.status !== 'active') throw new Error('RECEIVER_INACTIVE')

    const receiptNo = genReceiptNo('TRX')

    // Debit sender
    const updatedSender = await tx.wallet.update({
      where: { id: senderWallet.id },
      data: {
        availableBalance: { decrement: amount },
        lifetimeSent: { increment: amount },
      },
    })

    // Credit receiver
    const updatedReceiver = await tx.wallet.update({
      where: { id: receiverWallet.id },
      data: {
        availableBalance: { increment: amount },
        lifetimeReceived: { increment: amount },
      },
    })

    const transfer = await tx.transfer.create({
      data: {
        senderId,
        receiverId,
        amount,
        note,
        status: 'completed',
        receiptNo,
      },
    })

    // Sender transaction (debit)
    const senderTx = await tx.walletTransaction.create({
      data: {
        walletId: senderWallet.id,
        type: 'transfer_out',
        direction: 'debit',
        amount,
        balanceAfter: updatedSender.availableBalance,
        referenceId: transfer.id,
        referenceType: 'transfer',
        note: note || `Sent to ${receiver.username}`,
        counterpartyId: receiverId,
      },
    })

    // Receiver transaction (credit)
    const receiverTx = await tx.walletTransaction.create({
      data: {
        walletId: receiverWallet.id,
        type: 'transfer_in',
        direction: 'credit',
        amount,
        balanceAfter: updatedReceiver.availableBalance,
        referenceId: transfer.id,
        referenceType: 'transfer',
        note: note || `Received from ${sender.username}`,
        counterpartyId: senderId,
      },
    })

    // Double-entry ledger: debit sender_wallet, credit receiver_wallet
    await writeLedger(tx, [
      { walletId: senderWallet.id, entryType: 'debit', account: 'user_wallet', amount, transactionId: senderTx.id, referenceId: transfer.id, referenceType: 'transfer' },
      { walletId: receiverWallet.id, entryType: 'credit', account: 'user_wallet', amount, transactionId: receiverTx.id, referenceId: transfer.id, referenceType: 'transfer' },
    ])

    await tx.auditLog.create({
      data: {
        actorId: senderId,
        action: 'transfer_sent',
        entityType: 'transfer',
        entityId: transfer.id,
        after: JSON.stringify({ receiverId, amount, receiptNo }),
      },
    })

    // Notify receiver
    await tx.notification.create({
      data: {
        userId: receiverId,
        type: 'transfer',
        title: 'SkillCredits received',
        body: `${sender.username} sent you ${amount} SkillCredits${note ? ': ' + note : ''}`,
        data: JSON.stringify({ transferId: transfer.id, amount, senderId }),
      },
    })

    return { transfer, senderBalance: updatedSender.availableBalance }
  })
}

// ─── Escrow for orders: move available -> reserved ─────────────────
export async function escrowForOrder(params: {
  buyerId: string
  orderId: string
  amount: number
}) {
  const { buyerId, orderId, amount } = params
  if (amount <= 0) throw new Error('INVALID_AMOUNT')

  return db.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId: buyerId } })
    if (!wallet) throw new Error('WALLET_NOT_FOUND')
    if (wallet.frozen) throw new Error('WALLET_FROZEN')
    if (wallet.availableBalance < amount) throw new Error('INSUFFICIENT_BALANCE')

    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { decrement: amount },
        reservedBalance: { increment: amount },
        lifetimeSpent: { increment: amount },
      },
    })

    const wt = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'order_payment',
        direction: 'debit',
        amount,
        balanceAfter: updated.availableBalance,
        referenceId: orderId,
        referenceType: 'order',
        note: 'Escrow for order',
      },
    })

    await writeLedger(tx, [
      { walletId: wallet.id, entryType: 'debit', account: 'user_wallet', amount, transactionId: wt.id, referenceId: orderId, referenceType: 'order_escrow' },
      { walletId: wallet.id, entryType: 'credit', account: 'escrow', amount, transactionId: wt.id, referenceId: orderId, referenceType: 'order_escrow' },
    ])

    return updated.availableBalance
  })
}

// ─── Release escrow to seller on completion ─────────────────
export async function releaseEscrow(params: {
  orderId: string
  buyerId: string
  sellerId: string
  amount: number
}) {
  const { orderId, buyerId, sellerId, amount } = params

  return db.$transaction(async (tx) => {
    const buyerWallet = await tx.wallet.findUnique({ where: { userId: buyerId } })
    const sellerWallet = await tx.wallet.findUnique({ where: { userId: sellerId } })
    if (!buyerWallet || !sellerWallet) throw new Error('WALLET_NOT_FOUND')

    // Free reserved from buyer
    await tx.wallet.update({
      where: { id: buyerWallet.id },
      data: { reservedBalance: { decrement: amount } },
    })

    // Credit seller (earnings)
    const updatedSeller = await tx.wallet.update({
      where: { id: sellerWallet.id },
      data: {
        availableBalance: { increment: amount },
        lifetimeEarned: { increment: amount },
      },
    })

    const sellerTx = await tx.walletTransaction.create({
      data: {
        walletId: sellerWallet.id,
        type: 'order_earnings',
        direction: 'credit',
        amount,
        balanceAfter: updatedSeller.availableBalance,
        referenceId: orderId,
        referenceType: 'order',
        note: 'Earnings from completed order',
      },
    })

    // Double entry: debit escrow, credit seller wallet
    await writeLedger(tx, [
      { walletId: sellerWallet.id, entryType: 'debit', account: 'escrow', amount, transactionId: sellerTx.id, referenceId: orderId, referenceType: 'order_release' },
      { walletId: sellerWallet.id, entryType: 'credit', account: 'user_wallet', amount, transactionId: sellerTx.id, referenceId: orderId, referenceType: 'order_release' },
    ])
  })
}

// ─── Refund escrow back to buyer ─────────────────
export async function refundEscrow(params: {
  orderId: string
  buyerId: string
  amount: number
}) {
  const { orderId, buyerId, amount } = params

  return db.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId: buyerId } })
    if (!wallet) throw new Error('WALLET_NOT_FOUND')

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        reservedBalance: { decrement: amount },
        availableBalance: { increment: amount },
        lifetimeSpent: { decrement: amount },
      },
    })

    const wt = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'order_refund',
        direction: 'credit',
        amount,
        balanceAfter: wallet.availableBalance + amount,
        referenceId: orderId,
        referenceType: 'order',
        note: 'Refund from cancelled order',
      },
    })

    await writeLedger(tx, [
      { walletId: wallet.id, entryType: 'debit', account: 'escrow', amount, transactionId: wt.id, referenceId: orderId, referenceType: 'order_refund' },
      { walletId: wallet.id, entryType: 'credit', account: 'user_wallet', amount, transactionId: wt.id, referenceId: orderId, referenceType: 'order_refund' },
    ])
  })
}

// ─── Admin credit adjustment ─────────────────────────
export async function adminAdjust(params: {
  walletId: string
  amount: number // positive credit, negative debit
  reason: string
  adminId: string
}) {
  const { walletId, amount, reason, adminId } = params
  if (amount === 0) throw new Error('INVALID_AMOUNT')

  return db.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { id: walletId } })
    if (!wallet) throw new Error('WALLET_NOT_FOUND')

    const direction = amount > 0 ? 'credit' : 'debit'
    const absAmount = Math.abs(amount)

    const before = wallet.availableBalance
    if (direction === 'debit' && before < absAmount) throw new Error('INSUFFICIENT_BALANCE')

    const updated = await tx.wallet.update({
      where: { id: walletId },
      data: { availableBalance: { increment: amount } },
    })

    const wt = await tx.walletTransaction.create({
      data: {
        walletId,
        type: 'admin_adjustment',
        direction,
        amount: absAmount,
        balanceAfter: updated.availableBalance,
        note: reason,
      },
    })

    await writeLedger(tx, [
      { walletId, entryType: direction, account: 'user_wallet', amount: absAmount, transactionId: wt.id, referenceType: 'admin_adjustment' },
      { walletId, entryType: direction === 'credit' ? 'debit' : 'credit', account: 'platform', amount: absAmount, transactionId: wt.id, referenceType: 'admin_adjustment' },
    ])

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: 'admin_wallet_adjustment',
        entityType: 'wallet',
        entityId: walletId,
        before: JSON.stringify({ availableBalance: before }),
        after: JSON.stringify({ availableBalance: updated.availableBalance }),
        reason,
      },
    })

    return updated
  })
}

// ─── Referral reward ─────────────────────────
export async function grantReferralReward(params: {
  referrerId: string
  referredId: string
  amount: number
  reason: string
}) {
  const { referrerId, referredId, amount, reason } = params
  return db.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId: referrerId } })
    if (!wallet) throw new Error('WALLET_NOT_FOUND')

    const existing = await tx.referralReward.findFirst({
      where: { userId: referrerId, referredId, reason },
    })
    if (existing) return existing

    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { increment: amount },
        lifetimeReceived: { increment: amount },
      },
    })

    const reward = await tx.referralReward.create({
      data: { userId: referrerId, referredId, amount, reason },
    })

    const wt = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'referral_reward',
        direction: 'credit',
        amount,
        balanceAfter: updated.availableBalance,
        referenceId: reward.id,
        referenceType: 'referral',
        note: reason,
      },
    })

    await writeLedger(tx, [
      { walletId: wallet.id, entryType: 'credit', account: 'user_wallet', amount, transactionId: wt.id, referenceId: reward.id, referenceType: 'referral' },
      { walletId: wallet.id, entryType: 'debit', account: 'referral_pool', amount, transactionId: wt.id, referenceId: reward.id, referenceType: 'referral' },
    ])

    return reward
  })
}
