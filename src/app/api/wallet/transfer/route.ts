import { getCurrentUser, verifyPin } from '@/lib/auth'
import { db } from '@/lib/db'
import { transferCredits } from '@/lib/wallet'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { transferLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const schema = z.object({
  recipient: z.string().min(1), // username or userId
  amount: z.number().int().positive(),
  note: z.string().max(280).optional(),
  pin: z.string().length(4),
})

export const POST = transferLimit(async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)

    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)

    // PIN is required for transfers
    if (!user.transactionPinHash) return err('PIN_REQUIRED', 400)
    const pinOk = await verifyPin(data!.pin, user.transactionPinHash)
    if (!pinOk) return err('INVALID_PIN', 400)

    // Resolve recipient by username or id
    const recipient = await db.user.findFirst({
      where: { OR: [{ username: data!.recipient }, { id: data!.recipient }] },
    })
    if (!recipient) return err('Recipient not found', 404)

    const result = await transferCredits({
      senderId: user.id,
      receiverId: recipient.id,
      amount: data!.amount,
      note: data!.note,
    })

    return ok({ transfer: result.transfer, senderBalance: result.senderBalance }, 201)
  } catch (e) {
    return handleError(e)
  }
})

// Preview recipient before transfer
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const url = new URL(req.url)
    const q = url.searchParams.get('recipient')
    if (!q) return err('recipient query required', 400)

    const recipient = await db.user.findFirst({
      where: { OR: [{ username: q }, { id: q }] },
      include: { profile: true },
    })
    if (!recipient) return err('Recipient not found', 404)
    if (recipient.id === user.id) return err('CANNOT_TRANSFER_TO_SELF', 400)
    if (recipient.status !== 'active') return err('RECEIVER_INACTIVE', 400)

    return ok({
      recipient: {
        id: recipient.id,
        username: recipient.username,
        displayName: recipient.profile?.displayName,
        avatarUrl: recipient.profile?.avatarUrl,
        isVerified: recipient.profile?.isVerified,
      },
    })
  } catch (e) {
    return handleError(e)
  }
}
