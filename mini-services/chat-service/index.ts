import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

interface OnlineUser {
  socketId: string
  userId: string
  username: string
}

const online = new Map<string, OnlineUser>() // userId -> OnlineUser
const socketToUser = new Map<string, string>() // socketId -> userId
const typingUsers = new Map<string, Set<string>>() // conversationId -> Set(userId)

function emitUserStatus(userId: string) {
  const isOnline = online.has(userId)
  io.emit('presence', { userId, online: isOnline })
}

io.on('connection', (socket) => {
  console.log(`[chat] connected: ${socket.id}`)

  socket.on('auth', (payload: { userId: string; username: string }) => {
    if (!payload?.userId) return
    socketToUser.set(socket.id, payload.userId)
    online.set(payload.userId, { socketId: socket.id, userId: payload.userId, username: payload.username })
    emitUserStatus(payload.userId)
  })

  socket.on('join', (conversationId: string) => {
    socket.join(`convo:${conversationId}`)
  })

  socket.on('leave', (conversationId: string) => {
    socket.leave(`convo:${conversationId}`)
  })

  socket.on('typing', ({ conversationId, userId, isTyping }: { conversationId: string; userId: string; isTyping: boolean }) => {
    if (!typingUsers.has(conversationId)) typingUsers.set(conversationId, new Set())
    const set = typingUsers.get(conversationId)!
    if (isTyping) set.add(userId)
    else set.delete(userId)
    socket.to(`convo:${conversationId}`).emit('typing', { conversationId, userIds: Array.from(set) })
  })

  // Message is delivered to room; persistence happens via REST API from the sender.
  socket.on('message', (msg: { conversationId: string; messageId: string; senderId: string; senderUsername: string; content: string; type?: string; attachmentUrl?: string; createdAt: string }) => {
    io.to(`convo:${msg.conversationId}`).emit('message', msg)
    // broadcast delivery to others (read receipts handled client side)
  })

  socket.on('read', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
    socket.to(`convo:${conversationId}`).emit('read', { conversationId, userId })
  })

  socket.on('disconnect', () => {
    const userId = socketToUser.get(socket.id)
    if (userId) {
      online.delete(userId)
      emitUserStatus(userId)
    }
    socketToUser.delete(socket.id)
    console.log(`[chat] disconnected: ${socket.id}`)
  })

  socket.on('error', (err) => {
    console.error(`[chat] socket error ${socket.id}:`, err)
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[chat] SkillMarket chat service running on port ${PORT}`)
})

process.on('SIGTERM', () => httpServer.close(() => process.exit(0)))
process.on('SIGINT', () => httpServer.close(() => process.exit(0)))
