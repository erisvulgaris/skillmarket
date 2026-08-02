import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBuildOrWorker, ok, err, handleError, parseJsonBody } from '@/lib/api'
import { createSession, setSessionCookie } from '@/lib/auth'
import { setCors } from '@/lib/cors'
import { apiLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

function withCors<T extends (...args: any[]) => any>(handler: T): T {
  return (async (...args: any[]) => {
    const res = await handler(...args)
    if (res instanceof Response) Object.entries(setCors()).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }) as T
}

export const POST = withCors(apiLimit(async function POST(req: Request) {
  try {
    const body = await parseJsonBody(req)
    const email = body.email ? String(body.email).toLowerCase().trim() : null
    const name = body.name ? String(body.name).trim() : null
    const avatarUrl = body.picture || null

    if (!email || !email.includes('@')) {
      return err('INVALID_EMAIL', 400)
    }

    // Find or create user
    let user: any = await db.user.findUnique({
      where: { email },
      include: { profile: true, wallet: true },
    })

    if (!user) {
      const username = (name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : email.split('@')[0]) + '_' + Math.floor(100 + Math.random() * 900)
      const passwordHash = '$2a$10$w095j8.Wv0M1/R48E33s..v2Qf034.W86a45.'
      const pinHash = '$2a$10$w095j8.Wv0M1/R48E33s..'

      user = await db.user.create({
        data: {
          email,
          username,
          passwordHash,
          transactionPinHash: pinHash,
          role: 'buyer',
          emailVerifiedAt: new Date(),
          referralCode: `REF_${username.toUpperCase()}`,
          profile: {
            create: {
              displayName: name || username,
              avatarUrl,
              bio: 'SkillCart Marketplace Member',
              location: 'India',
              languages: '[]',
              skills: '[]',
            },
          },
          wallet: {
            create: {
              availableBalance: 100, // 100 SC Instant Welcome Bonus
            },
          },
        },
        include: { profile: true, wallet: true },
      })
    }

    const sess = await createSession(user.id)
    await setSessionCookie(sess.jwt, sess.expiresAt)
    return ok({ user, success: true }, 200)
  } catch (e) {
    return handleError(e)
  }
}))

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: setCors() })
}


export async function GET(req?: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 200 })
}