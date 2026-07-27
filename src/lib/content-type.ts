import { err } from './api'

const MAX_BODY_SIZE = 1024 * 1024

export function requireJson(req: Request): Response | null {
  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return err('Content-Type must be application/json', 415)
  }
  return null
}

export async function parseJsonBody<T>(req: Request): Promise<T> {
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    throw { status: 413, error: 'Request body too large (max 1MB)' }
  }
  return req.json()
}
