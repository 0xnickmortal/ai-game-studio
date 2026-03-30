// ============================================
// GET /api/agents/[id] - Get single agent with real system prompt
// Reads the .claude/agents/[id].md file for the full definition
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getAgentById } from '@/data/agents';
import { getRealSystemPrompt } from '@/lib/agents/parser';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = getAgentById(id);

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  // Try to get the real system prompt from the .md file
  const realPrompt = getRealSystemPrompt(id);

  return NextResponse.json({
    ...agent,
    systemPrompt: realPrompt || agent.systemPrompt,
    hasRealPrompt: !!realPrompt,
  });
}
