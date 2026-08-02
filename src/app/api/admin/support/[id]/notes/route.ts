export const revalidate = 0
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { adminLimit } from '@/lib/rate-limit'
import { requireJson } from '@/lib/content-type'
import { z } from 'zod'

// Get ticket with notes
export async function GET(req: Request, ctx: any) {
  if (!req || !req.url || process.env.IS_BUILD_TIME === 'true' || process.env.NEXT_PHASE) return NextResponse.json({ success: true, data: {} })
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  return adminLimit(async (r: Request, c: any) => {
    try {
      await requireAdmin()
      const { id } = await (c?.params || ctx?.params)
      const ticket = await db.supportTicket.findUnique({
        where: { id },
        include: {
          user: { include: { profile: true } },
          notes: {
            orderBy: { createdAt: 'desc' },
          },
        },
      })
      if (!ticket) return err('NOT_FOUND', 404)
      return ok({ ticket })
    } catch (e) {
      return handleError(e)
    }
  })(req, ctx)
}

const noteSchema = z.object({
  body: z.string().min(1).max(2000),
  internal: z.boolean().default(true),
})

// Add a note to a ticket
export async function POST(req: Request, ctx: any) {
  if (!req || !req.url || process.env.IS_BUILD_TIME === 'true' || process.env.NEXT_PHASE) return NextResponse.json({ success: true, data: {} })
  return adminLimit(async (r: Request, c: any) => {
    try {
      const admin = await requireAdmin()
      const { id } = await (c?.params || ctx?.params)
      const ct = requireJson(r); if (ct) return ct
      const { data, error } = await validateBody(noteSchema, r)
      if (error) return err(error, 422)

      const ticket = await db.supportTicket.findUnique({ where: { id } })
      if (!ticket) return err('NOT_FOUND', 404)

      const note = await db.supportTicketNote.create({
        data: {
          ticketId: id,
          authorId: admin.id,
          body: data!.body,
          internal: data!.internal,
        },
      })

      await writeAudit({ actorId: admin.id, action: 'admin_note_added', entityType: 'support_ticket', entityId: id, after: { body: data!.body } })

      return ok({ note }, 201)
    } catch (e) {
      return handleError(e)
    }
  })(req, ctx)
}
