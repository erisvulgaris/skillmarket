import { requireAdmin } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'
import { getPlatformFraudAlerts } from '@/lib/fraud'

export async function GET() {
  try {
    await requireAdmin()
    const alerts = await getPlatformFraudAlerts()
    const high = alerts.filter((a) => a.level === 'high').length
    const medium = alerts.filter((a) => a.level === 'medium').length
    const low = alerts.filter((a) => a.level === 'low').length
    return ok({
      alerts,
      summary: { total: alerts.length, high, medium, low },
    })
  } catch (e) {
    return handleError(e)
  }
}
