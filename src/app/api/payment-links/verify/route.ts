import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { isBuildOrWorker, ok, err, handleError, parseJsonBody } from '@/lib/api'
import { apiLimit } from '@/lib/rate-limit'

export async function POST(req?: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  return apiLimit(async (req: Request) => {
    try {
      const body = await parseJsonBody(req)
      const {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        transactionId,
      } = body

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !transactionId) {
        return err('MISSING_PAYMENT_PARAMS', 400)
      }

      const isValid = verifyRazorpaySignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      })

      if (!isValid) {
        return err('INVALID_PAYMENT_SIGNATURE', 400)
      }

      const transaction = await db.paymentLinkTransaction.findUnique({
        where: { id: transactionId },
        include: {
          paymentLink: {
            include: {
              seller: { include: { wallet: true } },
              service: true,
            },
          },
        },
      })

      if (!transaction) return err('TRANSACTION_NOT_FOUND', 404)
      if (transaction.status === 'completed') {
        return ok({ success: true, alreadyProcessed: true })
      }

      const { paymentLink, payerUserId, payerEmail, amountCredits, amountFiat } = transaction

      // 1. Credit seller's wallet in a safe transaction
      await db.$transaction(async (tx: any) => {
        // Mark transaction completed
        await tx.paymentLinkTransaction.update({
          where: { id: transactionId },
          data: {
            status: 'completed',
            razorpayPaymentId,
            completedAt: new Date(),
          },
        })

        // Increment usage count on payment link
        await tx.paymentLink.update({
          where: { id: paymentLink.id },
          data: { usesCount: { increment: 1 } },
        })

        // Get seller wallet
        let sellerWallet = await tx.wallet.findUnique({ where: { userId: paymentLink.sellerId } })
        if (!sellerWallet) {
          sellerWallet = await tx.wallet.create({ data: { userId: paymentLink.sellerId } })
        }

        const newBalance = sellerWallet.availableBalance + amountCredits

        // Update wallet balance & lifetime earned
        await tx.wallet.update({
          where: { id: sellerWallet.id },
          data: {
            availableBalance: newBalance,
            lifetimeEarned: { increment: amountCredits },
          },
        })

        // Create WalletTransaction record
        await tx.walletTransaction.create({
          data: {
            walletId: sellerWallet.id,
            type: 'payment_link_income',
            direction: 'credit',
            amount: amountCredits,
            balanceAfter: newBalance,
            referenceId: paymentLink.id,
            referenceType: 'payment_link',
            note: `Payment from ${payerEmail} via Payment Link "${paymentLink.title}"`,
            counterpartyId: payerUserId || null,
          },
        })

        // Send notification to seller
        await tx.notification.create({
          data: {
            userId: paymentLink.sellerId,
            type: 'payment_received',
            title: 'Payment Received!',
            body: `You received ${amountCredits} SC (₹${amountFiat}) from ${payerEmail} via link "${paymentLink.title}"`,
          },
        })

        // If link was attached to a specific service, auto-create order for buyer & seller
        if (paymentLink.serviceId && payerUserId) {
          const count = await tx.order.count()
          const orderNo = `ORD-${Date.now().toString(36).toUpperCase()}-${(count + 1).toString().padStart(4, '0')}`

          await tx.order.create({
            data: {
              orderNo,
              buyerId: payerUserId,
              sellerId: paymentLink.sellerId,
              serviceId: paymentLink.serviceId,
              price: amountCredits,
              requirements: `Auto-created order via payment link "${paymentLink.title}"`,
              status: 'in_progress',
              paymentStatus: 'paid',
              acceptedAt: new Date(),
            },
          })
        }
      })

      return ok({
        success: true,
        title: paymentLink.title,
        amountCredits,
        amountFiat,
        sellerName: paymentLink.seller.username,
      })
    } catch (e) {
      return handleError(e)
    }
  })(req as Request)
}
