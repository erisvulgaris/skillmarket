import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError } from '@/lib/api'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { id } = await params
    const saved = await db.savedService.upsert({
      where: { userId_serviceId: { userId: user.id, serviceId: id } },
      create: { userId: user.id, serviceId: id },
      update: {},
    })
    return ok({ saved: true, id: saved.id }, 201)
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { id } = await params
    await db.savedService.deleteMany({ where: { userId: user.id, serviceId: id } })
    return ok({ saved: false })
  } catch (e) {
    return handleError(e)
  }
}
