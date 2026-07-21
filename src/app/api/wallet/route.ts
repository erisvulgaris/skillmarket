import { getCurrentUser } from '@/lib/auth'
import { ok, err, handleError } from '@/lib/api'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const wallet = user.wallet
    if (!wallet) return err('WALLET_NOT_FOUND', 404)
    return ok({ wallet })
  } catch (e) {
    return handleError(e)
  }
}
