const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean) as string[]

export function setCors(reqOrHeaders?: Request | Record<string, string>, extraHeaders?: Record<string, string>): Record<string, string> {
  let headers: Record<string, string> = {}
  let origin: string | null = null
  if (reqOrHeaders instanceof Request) {
    const reqOrigin = reqOrHeaders.headers.get('origin') || ''
    origin = ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0] || 'http://localhost:3000'
    headers = extraHeaders || {}
  } else if (reqOrHeaders && typeof reqOrHeaders === 'object' && !('headers' in reqOrHeaders)) {
    headers = reqOrHeaders
  }
  // When no request context, return all headers except origin (callers like ok/err
  // are same-origin SPA calls). The withCors wrapper adds origin from the request.
  const base: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key',
    'Access-Control-Max-Age': '86400',
  }
  if (origin !== null) {
    base['Access-Control-Allow-Origin'] = origin
  }
  return { ...base, ...headers }
}

export async function handleCors(req: Request): Promise<Response | null> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: setCors(req),
    })
  }
  return null
}
