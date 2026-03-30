'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

const mdStyles: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.7,
  color: '#e2e8f0',
  wordBreak: 'break-word',
};

/** Render markdown content with proper styling for chat bubbles */
export default function MarkdownMessage({ content }: { content: string }) {
  return (
    <div style={mdStyles} className="md-msg">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p style={{ margin: '0 0 8px 0' }}>{children}</p>,
          strong: ({ children }) => <strong style={{ color: '#f1f5f9', fontWeight: 600 }}>{children}</strong>,
          em: ({ children }) => <em style={{ color: '#c4b5fd' }}>{children}</em>,
          h1: ({ children }) => <h2 style={{ fontSize: 18, fontWeight: 700, margin: '16px 0 8px', color: '#f1f5f9' }}>{children}</h2>,
          h2: ({ children }) => <h3 style={{ fontSize: 16, fontWeight: 600, margin: '14px 0 6px', color: '#f1f5f9' }}>{children}</h3>,
          h3: ({ children }) => <h4 style={{ fontSize: 15, fontWeight: 600, margin: '12px 0 4px', color: '#f1f5f9' }}>{children}</h4>,
          ul: ({ children }) => <ul style={{ margin: '4px 0 8px 0', paddingLeft: 20 }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin: '4px 0 8px 0', paddingLeft: 20 }}>{children}</ol>,
          li: ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <pre style={{ background: '#0f172a', borderRadius: 6, padding: '10px 12px', margin: '8px 0', overflow: 'auto', fontSize: 13 }}>
                  <code style={{ color: '#a5b4fc' }}>{children}</code>
                </pre>
              );
            }
            return <code style={{ background: '#312e81', padding: '1px 5px', borderRadius: 3, fontSize: 13, color: '#c4b5fd' }}>{children}</code>;
          },
          hr: () => <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '12px 0' }} />,
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', margin: '8px 0' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>{children}</table>
            </div>
          ),
          th: ({ children }) => <th style={{ border: '1px solid #475569', padding: '6px 10px', background: '#1e293b', fontWeight: 600, textAlign: 'left' }}>{children}</th>,
          td: ({ children }) => <td style={{ border: '1px solid #334155', padding: '6px 10px' }}>{children}</td>,
          blockquote: ({ children }) => (
            <blockquote style={{ borderLeft: '3px solid #6366f1', paddingLeft: 12, margin: '8px 0', color: '#94a3b8' }}>{children}</blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
