import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'
import { getPlatformFraudAlerts } from '@/lib/fraud'
import { adminLimit } from '@/lib/rate-limit'

export async function GET(req?: Request) {
  if (!req || !req.url || process.env.IS_BUILD_TIME === 'true' || process.env.NEXT_PHASE) return NextResponse.json({ success: true, data: {} })
  return adminLimit(async () => {
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
  })()
}