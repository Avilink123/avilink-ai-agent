import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Database utility functions
export async function createUser(sessionId: string, language = 'en') {
  return await prisma.user.upsert({
    where: { sessionId },
    update: { language },
    create: {
      sessionId,
      language,
    },
  })
}

export async function getUserConversations(userId: string) {
  return await prisma.conversation.findMany({
    where: { userId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function createConversation(userId: string, title?: string) {
  return await prisma.conversation.create({
    data: {
      userId,
      title,
    },
    include: {
      messages: true,
    },
  })
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system' | 'tool',
  content: string,
  metadata?: any
) {
  return await prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      metadata,
    },
  })
}

export async function updateConversationTitle(conversationId: string, title: string) {
  return await prisma.conversation.update({
    where: { id: conversationId },
    data: { title },
  })
}

export async function deleteConversation(conversationId: string) {
  // Delete messages first due to foreign key constraint
  await prisma.message.deleteMany({
    where: { conversationId },
  })
  
  return await prisma.conversation.delete({
    where: { id: conversationId },
  })
}

export async function archiveConversation(conversationId: string) {
  return await prisma.conversation.update({
    where: { id: conversationId },
    data: { isArchived: true },
  })
}

export async function getUserFiles(userId: string) {
  return await prisma.file.findMany({
    where: {
      userId,
      isDeleted: false,
    },
    orderBy: { uploadedAt: 'desc' },
  })
}

export async function saveFileMetadata(
  userId: string,
  filename: string,
  originalName: string,
  mimeType: string,
  size: number,
  path: string
) {
  return await prisma.file.create({
    data: {
      userId,
      filename,
      originalName,
      mimeType,
      size,
      path,
      status: 'uploaded',
    },
  })
}

export async function updateFileStatus(
  fileId: string,
  status: 'uploaded' | 'processing' | 'processed' | 'error',
  metadata?: any
) {
  return await prisma.file.update({
    where: { id: fileId },
    data: {
      status,
      metadata,
      processedAt: status === 'processed' ? new Date() : undefined,
    },
  })
}

export async function logCodeExecution(
  userId: string,
  language: string,
  code: string,
  output?: string,
  error?: string,
  duration?: number
) {
  return await prisma.codeExecution.create({
    data: {
      userId,
      language,
      code,
      output,
      error,
      status: error ? 'error' : 'completed',
      duration,
    },
  })
}

export async function logSystemEvent(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  component: string,
  userId?: string,
  metadata?: any
) {
  return await prisma.systemLog.create({
    data: {
      level,
      message,
      component,
      userId,
      metadata,
    },
  })
}