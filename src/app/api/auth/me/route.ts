import { getCurrentUser } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'
import { db } from '@/lib/db'
import { safeJsonParse } from '@/lib/api'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return ok({ user: null })
    const profile = user.profile
    const wallet = user.wallet
    return ok({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        referralCode: user.referralCode,
        twoFactorEnabled: user.twoFactorEnabled,
        profile: profile ? {
          displayName: profile.displayName,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          coverUrl: profile.coverUrl,
          location: profile.location,
          languages: safeJsonParse<string[]>(profile.languages, []),
          skills: safeJsonParse<string[]>(profile.skills, []),
          responseTimeMins: profile.responseTimeMins,
          isVerified: profile.isVerified,
          verificationType: profile.verificationType,
        } : null,
        wallet: wallet ? {
          availableBalance: wallet.availableBalance,
          reservedBalance: wallet.reservedBalance,
          pendingBalance: wallet.pendingBalance,
          lifetimePurchased: wallet.lifetimePurchased,
          lifetimeEarned: wallet.lifetimeEarned,
          lifetimeSent: wallet.lifetimeSent,
          lifetimeReceived: wallet.lifetimeReceived,
          lifetimeSpent: wallet.lifetimeSpent,
          frozen: wallet.frozen,
        } : null,
      },
    })
  } catch (e) {
    return handleError(e)
  }
}
