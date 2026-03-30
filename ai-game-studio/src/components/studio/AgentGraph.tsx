'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AGENTS } from '@/data/agents';
import { AgentDef } from '@/types';
import AgentGraphNode from './AgentGraphNode';

interface AgentGraphProps {
  onAgentClick: (agent: AgentDef) => void;
}

/** Layout constants */
const TIER_Y: Record<number, number> = { 1: 50, 2: 250, 3: 480 };
const NODE_W = 200;
// const NODE_H = 80;

/** Build nodes and edges from agent data */
function buildGraph(onAgentClick: (agent: AgentDef) => void) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Group agents by tier
  const tier1 = AGENTS.filter((a) => a.tier === 1);
  const tier2 = AGENTS.filter((a) => a.tier === 2);
  const tier3 = AGENTS.filter((a) => a.tier === 3);

  const layoutTier = (agents: AgentDef[], y: number) => {
    const totalWidth = agents.length * (NODE_W + 40);
    const startX = -totalWidth / 2;

    agents.forEach((agent, i) => {
      nodes.push({
        id: agent.id,
        type: 'agentNode',
        position: { x: startX + i * (NODE_W + 40), y },
        data: { agent, onClick: onAgentClick },
      });
    });
  };

  layoutTier(tier1, TIER_Y[1]);
  layoutTier(tier2, TIER_Y[2]);

  // Tier 3: group by escalatesTo for better layout
  const tier3Groups: Record<string, AgentDef[]> = {};
  tier3.forEach((a) => {
    const parent = a.escalatesTo || 'none';
    if (!tier3Groups[parent]) tier3Groups[parent] = [];
    tier3Groups[parent].push(a);
  });

  let xOffset = -(Object.keys(tier3Groups).length * (NODE_W + 30)) / 2;
  Object.values(tier3Groups).forEach((group) => {
    group.forEach((agent, i) => {
      nodes.push({
        id: agent.id,
        type: 'agentNode',
        position: { x: xOffset + i * (NODE_W + 20), y: TIER_Y[3] + (i % 2) * 100 },
        data: { agent, onClick: onAgentClick },
      });
    });
    xOffset += group.length * (NODE_W + 20) + 60;
  });

  // Build edges from delegatesTo
  AGENTS.forEach((agent) => {
    agent.delegatesTo.forEach((targetId) => {
      if (AGENTS.find((a) => a.id === targetId)) {
        edges.push({
          id: `${agent.id}-${targetId}`,
          source: agent.id,
          target: targetId,
          type: 'smoothstep',
          animated: false,
          style: { stroke: agent.color || '#6366f1', strokeWidth: 2, opacity: 0.6 },
        });
      }
    });
  });

  return { nodes, edges };
}

const nodeTypes = { agentNode: AgentGraphNode };

export default function AgentGraph({ onAgentClick }: AgentGraphProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraph(onAgentClick),
    [onAgentClick]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div style={{ width: '100%', height: 650, background: '#0f172a', borderRadius: 8 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={20} />
        <Controls
          style={{ background: '#1e293b', borderColor: '#334155' }}
        />
        <MiniMap
          nodeColor={(n) => n.data?.agent?.color || '#6366f1'}
          maskColor="rgba(15, 23, 42, 0.8)"
          style={{ background: '#1e293b', borderColor: '#334155' }}
        />
      </ReactFlow>
    </div>
  );
}
