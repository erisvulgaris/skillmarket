import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { z } from 'zod'

const packageSchema = z.object({
  name: z.string().min(1).max(30),
  description: z.string().min(1).max(300),
  price: z.number().int().positive().max(100000),
  deliveryDays: z.number().int().positive().max(90),
  features: z.array(z.string()).max(15).default([]),
  revisions: z.number().int().min(0).max(100).default(1),
  sortOrder: z.number().int().default(0),
})

// Create a package for a service (seller only)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { id } = await params
    const { data, error } = await validateBody(packageSchema, req)
    if (error) return err(error, 422)

    const service = await db.service.findUnique({ where: { id } })
    if (!service) return err('NOT_FOUND', 404)
    if (service.sellerId !== user.id) return err('FORBIDDEN', 403)

    const pkg = await db.servicePackage.create({
      data: {
        serviceId: id,
        name: data!.name,
        description: data!.description,
        price: data!.price,
        deliveryDays: data!.deliveryDays,
        features: JSON.stringify(data!.features),
        revisions: data!.revisions,
        sortOrder: data!.sortOrder,
      },
    })

    await writeAudit({ actorId: user.id, action: 'package_created', entityType: 'service_package', entityId: pkg.id })
    return ok({ package: pkg }, 201)
  } catch (e) {
    return handleError(e)
  }
}

// List packages for a service
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const packages = await db.servicePackage.findMany({
      where: { serviceId: id },
      orderBy: { sortOrder: 'asc' },
    })
    return ok({ packages })
  } catch (e) {
    return handleError(e)
  }
}
