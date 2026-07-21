import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { z } from 'zod'

const schema = z.object({
  subject: z.string().min(3).max(200),
  message: z.string().min(5).max(5000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
})

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)

    const ticket = await db.supportTicket.create({
      data: {
        userId: user.id,
        subject: data!.subject,
        message: data!.message,
        priority: data!.priority,
        status: 'open',
      },
    })

    // Notify admins
    const admins = await db.user.findMany({ where: { role: 'admin' }, select: { id: true } })
    await db.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: 'dispute',
        title: 'New support ticket',
        body: `${data!.priority.toUpperCase()}: ${data!.subject}`,
        data: JSON.stringify({ ticketId: ticket.id }),
      })),
    })

    await writeAudit({ actorId: user.id, action: 'support_ticket_created', entityType: 'support_ticket', entityId: ticket.id })

    return ok({ ticket }, 201)
  } catch (e) {
    return handleError(e)
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const tickets = await db.supportTicket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    return ok({ tickets })
  } catch (e) {
    return handleError(e)
  }
}
