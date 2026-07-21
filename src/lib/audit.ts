import { db } from './db'

export async function writeAudit(params: {
  actorId?: string
  action: string
  entityType: string
  entityId?: string
  before?: unknown
  after?: unknown
  ip?: string
  userAgent?: string
  reason?: string
}) {
  return db.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      before: params.before ? JSON.stringify(params.before) : undefined,
      after: params.after ? JSON.stringify(params.after) : undefined,
      ip: params.ip,
      userAgent: params.userAgent,
      reason: params.reason,
    },
  })
}

export async function pushNotification(params: {
  userId: string
  type: string
  title: string
  body: string
  data?: unknown
}) {
  return db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data ? JSON.stringify(params.data) : undefined,
    },
  })
}
