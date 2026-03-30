'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { AgentDef } from '@/types';

interface AgentNodeData {
  agent: AgentDef;
  onClick: (agent: AgentDef) => void;
}

function AgentGraphNode({ data }: NodeProps<AgentNodeData>) {
  const { agent, onClick } = data;

  const tierLabel = agent.tier === 1 ? '总监' : agent.tier === 2 ? '负责人' : '专家';
  const tierBg = agent.tier === 1 ? '#f59e0b' : agent.tier === 2 ? '#3b82f6' : '#10b981';

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: '#334155' }} />
      <div
        onClick={() => onClick(agent)}
        style={{
          padding: '10px 14px',
          borderRadius: 8,
          background: '#1e293b',
          border: `2px solid ${agent.color || '#6366f1'}`,
          cursor: 'pointer',
          minWidth: 160,
          transition: 'all 0.2s',
          boxShadow: `0 0 12px ${agent.color || '#6366f1'}33`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = `0 0 20px ${agent.color || '#6366f1'}66`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = `0 0 12px ${agent.color || '#6366f1'}33`;
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: agent.color || '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              color: '#fff',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
          >
            {agent.name[0]}
          </div>
          <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13 }}>
            {agent.name}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 4,
              background: tierBg,
              color: '#fff',
            }}
          >
            {tierLabel}
          </span>
          <span
            style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 4,
              background: '#312e81',
              color: '#a5b4fc',
            }}
          >
            {agent.model}
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#334155' }} />
    </>
  );
}

export default memo(AgentGraphNode);
