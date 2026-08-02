import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { ok, err, handleError } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { transferLimit } from '@/lib/rate-limit'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { randomBytes } from 'crypto'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'text/plain',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
  'video/mp4', 'video/webm',
  'application/zip',
]

export async function POST(req?: Request) {
  if (!req || !req.url || process.env.IS_BUILD_TIME === 'true' || process.env.NEXT_PHASE) return NextResponse.json({ success: true, data: {} })
  return transferLimit(async (req: Request) => {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return err('No file provided', 400)

    if (file.size > MAX_SIZE) return err('File too large (max 5MB)', 413)
    if (!ALLOWED_TYPES.includes(file.type)) return err('File type not allowed', 415)

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const isImage = file.type.startsWith('image/') && !file.type.includes('gif') && !file.type.includes('svg')
    const finalExt = isImage ? 'webp' : ext
    const filename = `${Date.now()}-${randomBytes(4).toString('hex')}.${finalExt}`
    const filepath = path.join(UPLOAD_DIR, filename)

    let buffer: Buffer = Buffer.from(await file.arrayBuffer())

    // Auto-compress and convert images using Sharp
    if (isImage) {
      try {
        const sharp = (await import('sharp')).default
        const processed = await sharp(buffer as any)
          .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer()
        buffer = Buffer.from(processed)
      } catch (err) {
        console.warn('[upload] sharp image compression failed, storing raw buffer', err)
      }
    }

    await writeFile(filepath, buffer)

    const url = `/uploads/${filename}`
    await writeAudit({
      actorId: user.id,
      action: 'file_upload',
      entityType: 'file',
      entityId: filename,
      after: { filename: file.name, size: file.size, type: file.type, url },
    })

    return ok({
      url,
      filename: file.name,
      size: file.size,
      type: file.type,
    }, 201)
  } catch (e) {
    return handleError(e)
  }
  })(req as Request)
}


export async function GET(req?: Request) {
  if (!req || !req.url || process.env.IS_BUILD_TIME === 'true' || process.env.NEXT_PHASE) return NextResponse.json({ success: true, data: {} })
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 200 })
}