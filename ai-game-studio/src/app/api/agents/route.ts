// ============================================
// GET /api/agents - List all agents
// GET /api/agents?tier=1 - Filter by tier
// GET /api/agents?domain=engineering - Filter by domain
// GET /api/agents?engine=godot - Filter by engine (universal + engine-specific)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { AGENTS, getAgentsByEngine } from '@/data/agents';
import { AgentTier, GameEngine } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get('tier');
  const domain = searchParams.get('domain');
  const engine = searchParams.get('engine');

  let agents = AGENTS;

  if (engine) {
    agents = getAgentsByEngine(engine as GameEngine);
  }

  if (tier) {
    const tierNum = Number(tier) as AgentTier;
    agents = agents.filter(a => a.tier === tierNum);
  }

  if (domain) {
    agents = agents.filter(a => a.domain === domain);
  }

  // Return without full system prompts for list view
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const summary = agents.map(({ systemPrompt: _, ...rest }) => rest);

  return NextResponse.json({ agents: summary, total: summary.length });
}
