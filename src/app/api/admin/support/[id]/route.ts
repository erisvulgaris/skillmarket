import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { pushNotification } from '@/lib/audit'
import { z } from 'zod'

const schema = z.object({
  status: z.enum(['open', 'pending', 'resolved', 'closed']).optional(),
  note: z.string().max(2000).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)

    const ticket = await db.supportTicket.findUnique({ where: { id } })
    if (!ticket) return err('NOT_FOUND', 404)

    const update: any = {}
    if (data!.status) update.status = data!.status
    await db.supportTicket.update({ where: { id }, data: update })

    // Add internal note if provided
    if (data!.note) {
      await db.supportTicketNote.create({
        data: {
          ticketId: id,
          authorId: admin.id,
          body: data!.note,
          internal: true,
        },
      })
    }

    // Notify user of status change
    if (data!.status && data!.status !== ticket.status) {
      await pushNotification({
        userId: ticket.userId,
        type: 'dispute',
        title: 'Support ticket updated',
        body: `Your ticket "${ticket.subject}" is now ${data!.status}`,
        data: { ticketId: id },
      })
    }

    await writeAudit({ actorId: admin.id, action: 'admin_ticket_updated', entityType: 'support_ticket', entityId: id, after: data })

    return ok({ success: true })
  } catch (e) {
    return handleError(e)
  }
}
