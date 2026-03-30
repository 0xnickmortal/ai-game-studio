'use client';

import React, { useState } from 'react';

interface ThinkingBlockProps {
  content: string;
  durationMs?: number;
  isStreaming?: boolean;
}

export default function ThinkingBlock({ content, durationMs, isStreaming }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);

  const duration = durationMs ? `${(durationMs / 1000).toFixed(1)}s` : isStreaming ? '...' : '';

  return (
    <div
      style={{
        borderLeft: '3px solid #9932cc',
        borderRadius: '0 8px 8px 0',
        background: '#1a1028',
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
          color: '#c084fc',
          userSelect: 'none',
        }}
      >
        <span style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0)' }}>
          ▶
        </span>
        <span>💭 Thinking</span>
        {duration && <span style={{ color: '#7c3aed', fontSize: 12 }}>{duration}</span>}
        {isStreaming && <span className="thinking-pulse" style={{ color: '#a78bfa' }}>●</span>}
        {!expanded && (
          <span style={{ color: '#6b7280', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {content.slice(0, 80)}...
          </span>
        )}
      </div>
      {expanded && (
        <div
          style={{
            padding: '0 12px 10px',
            fontSize: 12,
            lineHeight: 1.6,
            color: '#94a3b8',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 300,
            overflow: 'auto',
          }}
        >
          {content}
        </div>
      )}
      <style>{`.thinking-pulse { animation: pulse 1.5s infinite; } @keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
    </div>
  );
}
