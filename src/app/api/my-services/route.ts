import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, safeJsonParse } from '@/lib/api'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)

    const services = await db.service.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    })

    return ok({
      services: services.map((s) => ({
        ...s,
        tags: safeJsonParse<string[]>(s.tags, []),
        skills: safeJsonParse<string[]>(s.skills, []),
        images: safeJsonParse<string[]>(s.images, []),
        category: s.category ? { name: s.category.name } : null,
      })),
    })
  } catch (e) {
    return handleError(e)
  }
}
