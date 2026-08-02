import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { isBuildOrWorker, ok, handleError } from '@/lib/api'
import { adminLimit } from '@/lib/rate-limit'

export async function GET(req?: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  return adminLimit(async () => {
  try {
    await requireAdmin()
    const pages = await db.cmsPage.findMany({ orderBy: { slug: 'asc' } })
    return ok({ pages })
  } catch (e) {
    return handleError(e)
  }
  })()
}