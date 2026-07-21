import { destroySession, getCurrentUser, getSessionToken } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'

export async function POST() {
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
