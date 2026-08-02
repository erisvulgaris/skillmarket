import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { destroySession, getCurrentUser, getSessionToken } from '@/lib/auth'
import { isBuildOrWorker, ok, handleError } from '@/lib/api'

export async function POST(req?: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  try {
    const user = await getCurrentUser()
    const token = await getSessionToken()
    if (user) {
      await destroySession(token)
    }
    return ok({ success: true })
  } catch (e) {
    return handleError(e)
  }
}


export async function GET(req?: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 200 })
}