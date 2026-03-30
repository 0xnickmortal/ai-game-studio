'use client';

import React, { useState } from 'react';

interface ToolResultBlockProps {
  name: string;
  output: string;
  success: boolean;
}

export default function ToolResultBlock({ name, output, success }: ToolResultBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const icon = success ? '✅' : '❌';
  const borderColor = success ? '#16a974' : '#c0392b';
  const bg = success ? '#0f1f18' : '#1f0f0f';
  const preview = output.split('\n')[0]?.slice(0, 80) || '';

  return (
    <div
      style={{
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: '0 8px 8px 0',
        background: bg,
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
        <span style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0)', color: borderColor }}>
          ▶
        </span>
        <span>{icon}</span>
        <span style={{ color: success ? '#4ade80' : '#f87171', fontWeight: 500 }}>
          {name} — {success ? 'completed' : 'failed'}
        </span>
        {!expanded && preview && (
          <span style={{ color: '#64748b', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {preview}
          </span>
        )}
      </div>
      {expanded && (
        <pre
          style={{
            margin: '0 12px 10px',
            fontSize: 11,
            lineHeight: 1.5,
            color: '#cbd5e1',
            background: '#0f172a',
            padding: 8,
            borderRadius: 4,
            overflow: 'auto',
            maxHeight: 300,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {output}
        </pre>
      )}
    </div>
  );
}
