export const revalidate = 0
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody, parsePagination } from '@/lib/api'
import { pushNotification } from '@/lib/audit'
import { messageLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const sendSchema = z.object({
  type: z.enum(['text', 'image', 'file', 'voice']).default('text'),
  content: z.string().max(5000),
  attachmentUrl: z.string().url().optional(),
  attachmentName: z.string().optional(),
})

const editSchema = z.object({
  messageId: z.string().min(1),
  content: z.string().min(1).max(5000),
})

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { id } = await params
    const { skip, limit, page } = parsePagination(req)

    const member = await db.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: user.id } },
    })
    if (!member) return err('FORBIDDEN', 403)

    const where = { conversationId: id }
    const [items, total] = await Promise.all([
      db.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { sender: { include: { profile: true } } },
      }),
      db.message.count({ where }),
    ])

    // mark conversation read
    await db.conversationMember.update({
      where: { conversationId_userId: { conversationId: id, userId: user.id } },
      data: { lastReadAt: new Date() },
    })

    return ok({
      items: items.reverse().map((m) => ({
        ...m,
        sender: {
          id: m.sender.id,
          username: m.sender.username,
          avatarUrl: m.sender.profile?.avatarUrl,
        },
      })),
      total, page, limit,
    })
  } catch (e) {
    return handleError(e)
  }
}

export const POST = messageLimit(async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { id } = await params
    const { data, error } = await validateBody(sendSchema, req)
    if (error) return err(error, 422)

    const member = await db.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: user.id } },
    })
    if (!member) return err('FORBIDDEN', 403)

    const message = await db.message.create({
      data: {
        conversationId: id,
        senderId: user.id,
        type: data!.type,
        content: data!.content,
        attachmentUrl: data!.attachmentUrl,
        attachmentName: data!.attachmentName,
      },
    })
    await db.conversation.update({ where: { id }, data: { updatedAt: new Date() } })

    // Notify other members
    const others = await db.conversationMember.findMany({
      where: { conversationId: id, userId: { not: user.id } },
    })
    for (const o of others) {
      await pushNotification({
        userId: o.userId,
        type: 'message',
        title: 'New message',
        body: data!.content.slice(0, 80),
        data: { conversationId: id, messageId: message.id },
      })
    }

    return ok({ message }, 201)
  } catch (e) {
    return handleError(e)
  }
})

// PATCH — Edit a message (within 5 minutes of sending)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { id } = await params

    const member = await db.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: user.id } },
    })
    if (!member) return err('FORBIDDEN', 403)

    const { data, error } = await validateBody(editSchema, req)
    if (error) return err(error, 422)

    const message = await db.message.findUnique({
      where: { id: data!.messageId },
    })
    if (!message) return err('NOT_FOUND', 404)
    if (message.senderId !== user.id) return err('FORBIDDEN', 403)

    // Must be within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    if (message.createdAt < fiveMinutesAgo) return err('Edit window expired — messages can only be edited within 5 minutes', 403)

    const updated = await db.message.update({
      where: { id: data!.messageId },
      data: {
        content: data!.content,
        editedAt: new Date(),
      },
    })

    return ok({ message: updated })
  } catch (e) {
    return handleError(e)
  }
}

// DELETE — Soft-delete a message
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { id } = await params

    const member = await db.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: user.id } },
    })
    if (!member) return err('FORBIDDEN', 403)

    const url = new URL(req.url)
    const messageId = url.searchParams.get('messageId')
    if (!messageId) return err('messageId is required', 422)

    const message = await db.message.findUnique({
      where: { id: messageId },
    })
    if (!message) return err('NOT_FOUND', 404)
    if (message.senderId !== user.id) return err('FORBIDDEN', 403)

    const updated = await db.message.update({
      where: { id: messageId },
      data: {
        content: '[deleted]',
        deletedAt: new Date(),
      },
    })

    return ok({ message: updated })
  } catch (e) {
    return handleError(e)
  }
}
