// ============================================
// POST /api/chat - Send message to an AI agent
// Uses Claude Code CLI auth (no API key needed)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { sendAgentMessage } from '@/lib/claude/client';
import { getAgentById } from '@/data/agents';
import { ChatMessage } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, messages, projectContext } = body as {
      agentId: string;
      messages: ChatMessage[];
      projectContext?: string;
    };

    // Validate agent exists
    const agent = getAgentById(agentId);
    if (!agent) {
      return NextResponse.json({ error: `Agent "${agentId}" not found` }, { status: 404 });
    }

    // Call Claude via CLI (uses existing Claude Code auth)
    const reply = await sendAgentMessage(agent, messages, projectContext);

    return NextResponse.json({
      agentId,
      agentName: agent.name,
      reply,
      model: agent.model,
      timestamp: Date.now(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
