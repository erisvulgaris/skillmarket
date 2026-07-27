import { describe, it, expect } from 'vitest'
import { ok, err, handleError, parsePagination, safeJsonParse, getClientIp } from '@/lib/api'

describe('ok', () => {
  it('returns 200 JSON with success:true and data', async () => {
    const res = ok({ foo: 'bar' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ success: true, data: { foo: 'bar' } })
  })

  it('accepts custom status code', async () => {
    const res = ok(null, 201)
    expect(res.status).toBe(201)
  })
})

describe('err', () => {
  it('returns 400 JSON with success:false and error message', async () => {
    const res = err('Something went wrong')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ success: false, error: 'Something went wrong' })
  })

  it('accepts custom status and extra fields', async () => {
    const res = err('Not found', 404, { resource: 'user' })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toEqual({ success: false, error: 'Not found', resource: 'user' })
  })
})

describe('handleError', () => {
  it('returns 401 for UNAUTHORIZED', async () => {
    const res = handleError(new Error('UNAUTHORIZED'))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('UNAUTHORIZED')
  })

  it('returns 403 for FORBIDDEN', async () => {
    const res = handleError(new Error('FORBIDDEN'))
    expect(res.status).toBe(403)
  })

  it('returns 404 for NOT_FOUND', async () => {
    const res = handleError(new Error('NOT_FOUND'))
    expect(res.status).toBe(404)
  })

  it('returns 409 for ALREADY_EXISTS', async () => {
    const res = handleError(new Error('ALREADY_EXISTS'))
    expect(res.status).toBe(409)
  })

  it('returns 400 for known validation errors', async () => {
    const res = handleError(new Error('INVALID_AMOUNT'))
    expect(res.status).toBe(400)
  })

  it('returns 500 for unknown errors', async () => {
    const res = handleError(new Error('SOME_RANDOM_ERROR'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Internal server error')
  })

  it('handles non-Error inputs', async () => {
    const res = handleError('some string')
    expect(res.status).toBe(500)
  })
})

describe('parsePagination', () => {
  it('returns defaults when no params', () => {
    const req = new Request('http://localhost/api/test')
    const result = parsePagination(req)
    expect(result).toEqual({ page: 1, limit: 20, skip: 0 })
  })

  it('parses page and limit from query', () => {
    const req = new Request('http://localhost/api/test?page=3&limit=10')
    const result = parsePagination(req)
    expect(result).toEqual({ page: 3, limit: 10, skip: 20 })
  })

  it('clamps page to minimum 1', () => {
    const req = new Request('http://localhost/api/test?page=0')
    const result = parsePagination(req)
    expect(result.page).toBe(1)
  })

  it('clamps limit between 1 and 100', () => {
    const req1 = new Request('http://localhost/api/test?limit=0')
    expect(parsePagination(req1).limit).toBe(1)

    const req2 = new Request('http://localhost/api/test?limit=999')
    expect(parsePagination(req2).limit).toBe(100)
  })
})

describe('safeJsonParse', () => {
  it('returns parsed object for valid JSON', () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 })
  })

  it('returns fallback for null/undefined', () => {
    expect(safeJsonParse(null, 'default')).toBe('default')
    expect(safeJsonParse(undefined, 'default')).toBe('default')
  })

  it('returns fallback for invalid JSON', () => {
    expect(safeJsonParse('not json', [])).toEqual([])
  })
})

describe('getClientIp', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const req = new Request('http://localhost/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
    })
    expect(getClientIp(req)).toBe('192.168.1.1')
  })

  it('returns undefined when header is missing', () => {
    const req = new Request('http://localhost/api/test')
    expect(getClientIp(req)).toBeUndefined()
  })
})
