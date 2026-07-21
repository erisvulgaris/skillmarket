import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, parsePagination, safeJsonParse } from '@/lib/api'

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { skip, limit } = parsePagination(req)

    const memberships = await db.conversationMember.findMany({
      where: { userId: user.id },
      select: { conversationId: true, lastReadAt: true },
    })
    const ids = memberships.map((m) => m.conversationId)
    const readMap = new Map(memberships.map((m) => [m.conversationId, m.lastReadAt]))

    const convos = await db.conversation.findMany({
      where: { id: { in: ids } },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      include: {
        members: { include: { user: { include: { profile: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })

    const mapped = convos.map((c) => {
      const other = c.members.find((m) => m.userId !== user.id)
      const lastReadAt = readMap.get(c.id)
      const lastMessageTime = c.messages[0]?.createdAt
      const unread = lastMessageTime && (!lastReadAt || lastMessageTime > lastReadAt) && c.messages[0]?.senderId !== user.id
      return {
        id: c.id,
        type: c.type,
        orderId: c.orderId,
        updatedAt: c.updatedAt,
        lastMessage: c.messages[0] || null,
        unread: !!unread,
        other: other
          ? {
              id: other.user.id,
              username: other.user.username,
              displayName: other.user.profile?.displayName,
              avatarUrl: other.user.profile?.avatarUrl,
              isVerified: other.user.profile?.isVerified,
            }
          : null,
      }
    })

    return ok({ conversations: mapped })
  } catch (e) {
    return handleError(e)
  }
}
