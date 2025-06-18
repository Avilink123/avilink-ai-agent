export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, files } = await request.json();

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });
    } else {
      // Create new conversation with a default user
      const user = await prisma.user.upsert({
        where: { sessionId: 'default-session' },
        update: {},
        create: {
          sessionId: 'default-session',
          language: 'en'
        }
      });

      conversation = await prisma.conversation.create({
        data: {
          userId: user.id,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        },
        include: { messages: true }
      });
    }

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
        metadata: files ? { attachments: files } : undefined
      }
    });

    // Prepare messages for LLM
    const messages = [
      ...conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call LLM API (using OpenAI as fallback)
    const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.DEEPSEEK_API_KEY;
    const apiUrl = process.env.OPENAI_API_KEY ? 'https://api.openai.com/v1/chat/completions' : 'https://api.anthropic.com/v1/messages';
    
    const llmResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_API_KEY ? 'gpt-4' : 'claude-3-sonnet-20240229',
        messages: [
          {
            role: 'system',
            content: `You are Avilink, an advanced AI assistant with access to powerful tools including:
- DeepSearch: Web search across 20+ credible sources
- Python Execution: Run Python code securely
- File Processing: Analyze PDFs, Word docs, Excel, images
- Web Browsing: Browse and analyze web content

You can execute tools when needed to help users. Be helpful, accurate, and efficient.`
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!llmResponse.ok) {
      throw new Error(`LLM API error: ${llmResponse.status}`);
    }

    const llmData = await llmResponse.json();
    const assistantMessage = llmData.choices?.[0]?.message?.content || llmData.content?.[0]?.text || 'I apologize, but I encountered an error processing your request.';

    // Save assistant message
    const savedAssistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantMessage
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      conversationId: conversation.id,
      message: {
        id: savedAssistantMessage.id,
        role: 'assistant',
        content: assistantMessage,
        createdAt: savedAssistantMessage.createdAt
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-session';

    // Get user and their conversations
    const user = await prisma.user.findUnique({
      where: { sessionId: userId },
      include: {
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { updatedAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ conversations: [] });
    }

    return NextResponse.json({ conversations: user.conversations });

  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}