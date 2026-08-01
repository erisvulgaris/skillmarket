export const revalidate = 0
export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { adminAdjust } from '@/lib/wallet'
import { adminLimit } from '@/lib/rate-limit'
import { requireJson } from '@/lib/content-type'
import { z } from 'zod'

const schema = z.object({
  amount: z.number().int().refine((n) => n !== 0, 'must be non-zero'),
  reason: z.string().min(3).max(200),
})

export const POST = adminLimit(async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const ct = requireJson(req); if (ct) return ct
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)

    const wallet = await adminAdjust({
      walletId: id,
      amount: data!.amount,
      reason: data!.reason,
      adminId: admin.id,
    })

    return ok({ wallet })
  } catch (e) {
    return handleError(e)
  }
})


export async function GET() {
  return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 })
}
