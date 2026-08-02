import { NextResponse } from 'next/server'
export const revalidate = 0
export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { pushNotification } from '@/lib/audit'
import { adminLimit } from '@/lib/rate-limit'
import { requireJson } from '@/lib/content-type'
import { z } from 'zod'

const schema = z.object({
  status: z.enum(['open', 'pending', 'resolved', 'closed']).optional(),
  note: z.string().max(2000).optional(),
})

export async function PATCH(req?: Request, ctx?: any) {
  if (!req || !req.url || process.env.IS_BUILD_TIME === 'true' || process.env.NEXT_PHASE) return NextResponse.json({ success: true, data: {} })
  return adminLimit(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const ct = requireJson(req); if (ct) return ct
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
  })(req as Request, ctx as any)
}


export async function GET(req?: Request) {
  if (!req || !req.url || process.env.IS_BUILD_TIME === 'true' || process.env.NEXT_PHASE) return NextResponse.json({ success: true, data: {} })
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 200 })
}