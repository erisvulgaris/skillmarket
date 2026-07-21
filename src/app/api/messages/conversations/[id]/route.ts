import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody, parsePagination } from '@/lib/api'
import { pushNotification } from '@/lib/audit'
import { z } from 'zod'

const sendSchema = z.object({
  type: z.enum(['text', 'image', 'file', 'voice']).default('text'),
  content: z.string().max(5000),
  attachmentUrl: z.string().url().optional(),
  attachmentName: z.string().optional(),
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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
}
