'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button, Tag, Tooltip } from 'antd';
import { SendOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons';
import { useClaudeStream, resetStream } from '@/lib/streaming/useClaudeStream';
import { ChatMsg, MSG_COLORS } from '@/types/chat';
import MarkdownMessage from './MarkdownMessage';
import './claude-chat.css';

interface ClaudeChatProps {
  agentName?: string;
  model?: string;
  placeholder?: string;
  style?: React.CSSProperties;
}

export default function ClaudeChat({ agentName, model, placeholder, style }: ClaudeChatProps) {
  const { messages, isStreaming, sessionId, startSession, sendMessage, respondPermission, reset } = useClaudeStream();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (isAtBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    if (sessionId) {
      sendMessage(text);
    } else {
      startSession(text, model);
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="claude-chat" style={style}>
      {/* Header */}
      <div className="cc-header">
        <div className="cc-header-title">
          <span>🤖</span>
          <span>{agentName || 'Claude Code'}</span>
          {isStreaming && <Tag color="green" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>streaming</Tag>}
          {sessionId && <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', color: '#64748b', background: '#1e293b', border: '1px solid #334155' }}>session</Tag>}
        </div>
        <div className="cc-header-actions">
          <Tooltip title="New conversation">
            <Button type="text" size="small" icon={<DeleteOutlined />} onClick={reset} disabled={isStreaming || messages.length === 0} style={{ color: '#64748b' }} />
          </Tooltip>
        </div>
      </div>

      {/* Messages */}
      <div className="cc-messages" ref={scrollRef} onScroll={handleScroll}>
        {messages.length === 0 && !isStreaming && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#475569' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
            <div style={{ fontSize: 16, color: '#94a3b8', marginBottom: 8 }}>{agentName || 'Claude Code'}</div>
            <div style={{ fontSize: 13 }}>{placeholder || 'Start a conversation...'}</div>
          </div>
        )}

        {messages.map((msg, i) => <MsgRow key={i} msg={msg} onPermission={respondPermission} />)}

        {/* Typing indicator */}
        {isStreaming && (messages.length === 0 || messages[messages.length - 1]?.type === 'user') && (
          <div className="cc-msg assistant">
            <div className="cc-typing">
              <div className="cc-typing-dots"><span /><span /><span /></div>
              <span style={{ color: '#64748b', fontSize: 12 }}>{agentName || 'Claude'} is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="cc-input-area">
        <div className="cc-input-wrapper">
          <textarea
            ref={inputRef}
            className="cc-input-field"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Ask Claude anything... (Shift+Enter for newline)'}
            disabled={isStreaming}
            rows={1}
          />
          <div className="cc-input-controls">
            <div className="cc-input-left">
              {model && <Tag style={{ fontSize: 10, color: '#64748b', background: '#1e293b', border: '1px solid #334155' }}>{model}</Tag>}
            </div>
            <div className="cc-input-right">
              {isStreaming ? (
                <Button size="small" danger icon={<StopOutlined />} style={{ fontSize: 11 }}>Stop</Button>
              ) : (
                <Button size="small" type="primary" onClick={handleSend} disabled={!input.trim()} icon={<SendOutlined />} style={{ fontSize: 11 }}>Send</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Message Row — simple switch on msg.type (matches script.ts rendering) ──

function MsgRow({ msg, onPermission }: { msg: ChatMsg; onPermission: (id: string, approved: boolean) => void }) {
  const colors = MSG_COLORS[msg.type] || MSG_COLORS.output;

  switch (msg.type) {
    case 'user':
      return (
        <div className="cc-msg user">
          <div className="cc-msg-header">
            <span>👤</span>
            <span style={{ color: colors[0], fontWeight: 600, fontSize: 12 }}>You</span>
          </div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
        </div>
      );

    case 'output':
      return (
        <div className="cc-msg claude">
          <div className="cc-msg-header">
            <span>🤖</span>
            <span style={{ color: colors[0], fontWeight: 600, fontSize: 12 }}>Claude</span>
          </div>
          <MarkdownMessage content={msg.text} />
        </div>
      );

    case 'thinking':
      return <ThinkingRow text={msg.text} />;

    case 'toolUse':
      return <ToolUseRow msg={msg} />;

    case 'toolResult':
      if (msg.hidden) return null;
      return <ToolResultRow msg={msg} />;

    case 'permissionRequest':
      return <PermissionRow msg={msg} onPermission={onPermission} />;

    case 'error':
      return (
        <div className="cc-msg error">
          <span>⚠️</span> {msg.text}
        </div>
      );

    default:
      return null;
  }
}

// ── Thinking (collapsible) ──

function ThinkingRow({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="cc-msg thinking">
      <div className="cc-collapsible-trigger" onClick={() => setOpen(!open)}>
        <span className={`cc-collapsible-arrow ${open ? 'open' : ''}`}>▶</span>
        <span>💭 Thinking</span>
        {!open && <span style={{ color: '#6b7280', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{text.slice(0, 120)}</span>}
      </div>
      {open && <div className="cc-collapsible-body">{text}</div>}
    </div>
  );
}

// ── Tool Use ──

function ToolUseRow({ msg }: { msg: Extract<ChatMsg, { type: 'toolUse' }> }) {
  const [open, setOpen] = useState(false);
  const summary = getToolSummary(msg.toolName, msg.rawInput);
  return (
    <div className="cc-msg tool">
      <div className="cc-tool-header">
        <div className="cc-tool-icon">⚡</div>
        <span className="cc-tool-name">{msg.toolName}</span>
      </div>
      {summary && <div className="cc-tool-summary">{summary}</div>}
      <div className="cc-collapsible-trigger" onClick={() => setOpen(!open)} style={{ marginTop: 4 }}>
        <span className={`cc-collapsible-arrow ${open ? 'open' : ''}`}>▶</span>
        <span style={{ color: '#64748b', fontSize: 11 }}>Parameters</span>
      </div>
      {open && (
        <pre style={{ fontSize: 11, color: '#94a3b8', background: '#0f172a', padding: 8, borderRadius: 4, margin: '4px 0 0', overflow: 'auto', maxHeight: 200 }}>
          {JSON.stringify(msg.rawInput, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ── Tool Result ──

function ToolResultRow({ msg }: { msg: Extract<ChatMsg, { type: 'toolResult' }> }) {
  const [open, setOpen] = useState(false);
  const preview = msg.content.split('\n')[0]?.slice(0, 100) || '';
  return (
    <div className="cc-msg tool-result">
      <div className="cc-tool-header">
        <span>{msg.isError ? '❌' : '✅'}</span>
        <span style={{ color: msg.isError ? '#f87171' : '#4ade80', fontWeight: 500, fontSize: 12 }}>
          {msg.isError ? 'Failed' : 'Completed'}
        </span>
      </div>
      <div className="cc-collapsible-trigger" onClick={() => setOpen(!open)}>
        <span className={`cc-collapsible-arrow ${open ? 'open' : ''}`}>▶</span>
        <span style={{ color: '#64748b', fontSize: 11 }}>{open ? 'Output' : preview}</span>
      </div>
      {open && (
        <pre style={{ fontSize: 11, color: '#94a3b8', background: '#0f172a', padding: 8, borderRadius: 4, margin: '4px 0 0', overflow: 'auto', maxHeight: 300, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {msg.content}
        </pre>
      )}
    </div>
  );
}

// ── Permission Request (inline Allow/Deny/Always Allow) ──

function PermissionRow({ msg, onPermission }: { msg: Extract<ChatMsg, { type: 'permissionRequest' }>; onPermission: (id: string, approved: boolean) => void }) {
  if (msg.status === 'approved') {
    return (
      <div className="cc-msg permission">
        <div className="cc-perm-decision allowed">✅ You allowed this</div>
      </div>
    );
  }
  if (msg.status === 'denied') {
    return (
      <div className="cc-msg permission">
        <div className="cc-perm-decision denied">❌ You denied this</div>
      </div>
    );
  }

  return (
    <div className="cc-msg permission">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span>🔐</span>
        <span style={{ fontWeight: 600 }}>Permission Required</span>
      </div>
      <div style={{ fontSize: 13, marginBottom: 8 }}>
        Allow <strong>{msg.tool}</strong> to execute?
      </div>
      {msg.input && (
        <pre style={{ fontSize: 11, color: '#94a3b8', background: '#0f172a', padding: 8, borderRadius: 4, margin: '0 0 8px', overflow: 'auto', maxHeight: 150 }}>
          {JSON.stringify(msg.input, null, 2)}
        </pre>
      )}
      <div className="cc-perm-buttons">
        <Button size="small" onClick={() => onPermission(msg.id, false)} style={{ color: '#e74c3c', borderColor: '#e74c3c' }}>Deny</Button>
        <Button size="small" type="primary" onClick={() => onPermission(msg.id, true)} style={{ background: '#16a34a', borderColor: '#16a34a' }}>Allow</Button>
      </div>
    </div>
  );
}

function getToolSummary(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case 'Read': return String(input.file_path || '');
    case 'Write': return String(input.file_path || '');
    case 'Edit': return String(input.file_path || '');
    case 'Bash': return String(input.command || '').slice(0, 100);
    case 'Glob': return String(input.pattern || '');
    case 'Grep': return `/${input.pattern || ''}/ in ${input.path || '.'}`;
    default: return '';
  }
}
