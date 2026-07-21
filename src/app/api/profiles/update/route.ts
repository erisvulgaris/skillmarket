import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { z } from 'zod'

const schema = z.object({
  displayName: z.string().max(60).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  skills: z.array(z.string()).max(15).optional(),
  languages: z.array(z.string()).max(10).optional(),
  avatarUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
})

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)

    const update: any = {}
    if (data!.displayName !== undefined) update.displayName = data!.displayName
    if (data!.bio !== undefined) update.bio = data!.bio
    if (data!.location !== undefined) update.location = data!.location
    if (data!.skills !== undefined) update.skills = JSON.stringify(data!.skills)
    if (data!.languages !== undefined) update.languages = JSON.stringify(data!.languages)
    if (data!.avatarUrl !== undefined) update.avatarUrl = data!.avatarUrl
    if (data!.coverUrl !== undefined) update.coverUrl = data!.coverUrl

    await db.profile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...update, skills: update.skills || '[]', languages: update.languages || '[]' },
      update,
    })

    await writeAudit({ actorId: user.id, action: 'profile_updated', entityType: 'user', entityId: user.id, after: update })

    return ok({ success: true })
  } catch (e) {
    return handleError(e)
  }
}
