import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { ok, err, handleError, parseJsonBody } from '@/lib/api'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return err('UNAUTHORIZED', 401)
    }

    const { id } = await params
    const body = await parseJsonBody(req)

    const updated = await db.category.update({
      where: { id },
      data: {
        enabled: typeof body.enabled === 'boolean' ? body.enabled : undefined,
        name: body.name || undefined,
        icon: body.icon || undefined,
      },
    })

    return ok({ category: updated })
  } catch (e) {
    return handleError(e)
  }
}
