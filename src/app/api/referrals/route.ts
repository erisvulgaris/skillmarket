import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError } from '@/lib/api'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)

    const [referrals, rewards] = await Promise.all([
      db.user.findMany({
        where: { referredById: user.id },
        select: { id: true, username: true, createdAt: true, profile: { select: { avatarUrl: true } } },
      }),
      db.referralReward.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const totalEarned = rewards.reduce((s, r) => s + r.amount, 0)
    const count = referrals.length

    return ok({
      referralCode: user.referralCode,
      referralLink: `/register?ref=${user.referralCode}`,
      count,
      totalEarned,
      referrals,
      rewards,
    })
  } catch (e) {
    return handleError(e)
  }
}
