'use client';

import React, { useState } from 'react';

interface ToolUseBlockProps {
  name: string;
  input: Record<string, unknown>;
  status: 'running' | 'completed' | 'failed';
}

const TOOL_ICONS: Record<string, string> = {
  Read: '📖', Write: '✏️', Edit: '📝', Bash: '💻', Glob: '🔍',
  Grep: '🔎', TodoWrite: '📋', WebSearch: '🌐', WebFetch: '🌍',
};

export default function ToolUseBlock({ name, input, status }: ToolUseBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const icon = TOOL_ICONS[name] || '🔧';
  const statusIcon = status === 'running' ? '⏳' : status === 'completed' ? '✅' : '❌';
  const statusColor = status === 'running' ? '#eab308' : status === 'completed' ? '#22c55e' : '#ef4444';

  // Special display for common tools
  const summary = renderSummary(name, input);

  return (
    <div
      style={{
        borderLeft: '3px solid #5d6fe1',
        borderRadius: '0 8px 8px 0',
        background: '#131830',
        marginBottom: 8,
        overflow: 'hidden',
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          userSelect: 'none',
        }}
      >
        <span style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0)', color: '#6366f1' }}>
          ▶
        </span>
        <span>{icon}</span>
        <span style={{ color: '#a5b4fc', fontWeight: 500 }}>{name}</span>
        <span style={{ color: statusColor, fontSize: 12 }}>{statusIcon}</span>
        {summary && !expanded && (
          <span style={{ color: '#64748b', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {summary}
          </span>
        )}
      </div>
      {expanded && (
        <div style={{ padding: '0 12px 10px' }}>
          {summary && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{summary}</div>}
          <pre
            style={{
              fontSize: 11,
              lineHeight: 1.5,
              color: '#cbd5e1',
              background: '#0f172a',
              padding: 8,
              borderRadius: 4,
              overflow: 'auto',
              maxHeight: 200,
              margin: 0,
            }}
          >
            {JSON.stringify(input, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function renderSummary(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case 'Read': return String(input.file_path || '');
    case 'Write': return String(input.file_path || '');
    case 'Edit': return String(input.file_path || '');
    case 'Bash': return String(input.command || '').slice(0, 80);
    case 'Glob': return String(input.pattern || '');
    case 'Grep': return String(input.pattern || '');
    case 'WebSearch': return String(input.query || '');
    default: return '';
  }
}
