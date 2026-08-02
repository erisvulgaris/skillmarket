import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { isBuildOrWorker, ok, err, handleError } from '@/lib/api'
import { z } from 'zod'

// In-memory typing tracker
const typingUsers = new Map<string, { userId: string; conversationId: string; expiresAt: number }>()

// Cleanup stale entries every 15 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, val] of typingUsers.entries()) {
      if (val.expiresAt < now) typingUsers.delete(key)
    }
  }, 15_000).unref?.()
}

const typingSchema = z.object({
  conversationId: z.string().min(1),
})

export async function POST(req: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)

    const body = await req.json()
    const parsed = typingSchema.safeParse(body)
    if (!parsed.success) return err('Invalid request body', 422)

    const { conversationId } = parsed.data

    // Verify user is a member of this conversation
    const member = await db.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    })
    if (!member) return err('FORBIDDEN', 403)

    // Set typing flag (expires in 3 seconds)
    const key = `${conversationId}:${user.id}`
    typingUsers.set(key, {
      userId: user.id,
      conversationId,
      expiresAt: Date.now() + 3000,
    })

    // Get all currently typing users in this conversation (excluding current user)
    const now = Date.now()
    const activeTyping: string[] = []
    for (const [, val] of typingUsers.entries()) {
      if (val.conversationId === conversationId && val.userId !== user.id && val.expiresAt > now) {
        activeTyping.push(val.userId)
      }
    }

    return ok({ typingUserIds: activeTyping })
  } catch (e) {
    return handleError(e)
  }
}


export async function GET(req?: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 200 })
}