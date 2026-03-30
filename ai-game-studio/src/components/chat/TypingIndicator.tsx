'use client';

import React from 'react';

export default function TypingIndicator({ label }: { label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
      <div className="typing-dots" style={{ display: 'flex', gap: 4 }}>
        <span /><span /><span />
      </div>
      {label && <span style={{ color: '#64748b', fontSize: 12 }}>{label}</span>}
      <style>{`
        .typing-dots span {
          width: 6px; height: 6px; border-radius: 50%;
          background: #6366f1; display: inline-block;
          animation: typing-bounce 1.4s infinite;
        }
        .typing-dots span:nth-child(1) { animation-delay: 0s; }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing-bounce {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
