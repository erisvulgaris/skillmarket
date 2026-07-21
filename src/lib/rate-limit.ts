// Simple in-memory rate limiter for API routes.
// For production with multiple instances, replace with Redis.

const buckets = new Map<string, { count: number; resetAt: number }>()

interface RateLimitOptions {
  windowMs: number
  max: number
  keyFn?: (req: Request) => string
}

const DEFAULT_KEY = (req: Request) => {
  const fwd = req.headers.get('x-forwarded-for')
  const ip = fwd ? fwd.split(',')[0].trim() : 'unknown'
  return ip
}

export function rateLimit(options: RateLimitOptions) {
  return function <T extends (...args: any[]) => any>(handler: T): T {
    return (async (...args: Parameters<T>) => {
      const req = args[0] as Request
      const keyBase = options.keyFn ? options.keyFn(req) : DEFAULT_KEY(req)
      const route = new URL(req.url).pathname
      const key = `${route}:${keyBase}`

      const now = Date.now()
      const bucket = buckets.get(key)

      if (!bucket || bucket.resetAt < now) {
        buckets.set(key, { count: 1, resetAt: now + options.windowMs })
      } else {
        bucket.count++
        if (bucket.count > options.max) {
          const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
          return new Response(
            JSON.stringify({ success: false, error: 'Too many requests. Please try again later.' }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(retryAfter),
              },
            }
          ) as any
        }
      }

      return handler(...args)
    }) as T
  }
}

// Cleanup old buckets periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt < now) buckets.delete(key)
    }
  }, 5 * 60 * 1000).unref?.()
}

// Preset limiters
export const strictLimit = rateLimit({ windowMs: 60 * 1000, max: 10 }) // login, register
export const transferLimit = rateLimit({ windowMs: 60 * 1000, max: 20 }) // transfers, purchases
export const messageLimit = rateLimit({ windowMs: 60 * 1000, max: 60 }) // messaging
export const apiLimit = rateLimit({ windowMs: 60 * 1000, max: 120 }) // general
