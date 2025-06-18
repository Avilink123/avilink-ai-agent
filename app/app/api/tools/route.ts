export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ToolRegistry } from '@/lib/tools/tool-registry';

const prisma = new PrismaClient();
const toolRegistry = new ToolRegistry();

export async function POST(request: NextRequest) {
  try {
    const { toolName, parameters, conversationId } = await request.json();

    // Validate input
    if (!toolName || !parameters) {
      return NextResponse.json({ error: 'Tool name and parameters are required' }, { status: 400 });
    }

    // Get tool
    const tool = toolRegistry.getTool(toolName);
    if (!tool) {
      return NextResponse.json({ error: `Tool '${toolName}' not found` }, { status: 404 });
    }

    // Execute tool
    const result = await tool.execute(parameters);

    // Log tool execution if needed
    if (conversationId) {
      await prisma.message.create({
        data: {
          conversationId,
          role: 'tool',
          content: JSON.stringify({
            tool: toolName,
            parameters,
            result
          }),
          metadata: { toolName, executionTime: result.executionTime }
        }
      });
    }

    return NextResponse.json({ result });

  } catch (error) {
    console.error('Tool execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute tool', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const tools = toolRegistry.getAvailableTools();
    return NextResponse.json({ tools });
  } catch (error) {
    console.error('Get tools error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available tools' },
      { status: 500 }
    );
  }
}