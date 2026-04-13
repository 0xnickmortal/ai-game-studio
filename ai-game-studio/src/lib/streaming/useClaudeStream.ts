// ============================================
// useClaudeStream — 1:1 translation of claude-code-chat script.ts
// Each SSE event = one ChatMsg in the list (no dedup, no accumulation)
// ============================================

import { useCallback, useEffect, useState } from 'react';
import { ChatMsg } from '@/types/chat';

// ── Module-level state (survives navigation) ──
const STORAGE_KEY = 'claude-chat';
let _messages: ChatMsg[] = [];
let _isStreaming = false;
let _sessionId = '';
let _internalId = '';
const _listeners = new Set<() => void>();

// Restore from localStorage — deferred to first hook mount (avoids SSR hydration mismatch)
let _restored = false;

function notify() { _listeners.forEach(fn => fn()); }

function push(msg: ChatMsg) {
  _messages = [..._messages, msg];
  persist();
  notify();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: _messages, sessionId: _sessionId }));
  } catch { /* full */ }
}

export function resetStream() {
  _messages = [];
  _isStreaming = false;
  _sessionId = '';
  _internalId = '';
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ok */ }
  notify();
}

export function useClaudeStream() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Restore from localStorage on first client mount
    if (!_restored) {
      _restored = true;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          _messages = data.messages || [];
          _sessionId = data.sessionId || '';
        }
      } catch { /* ignore */ }
    }

    const listener = () => forceUpdate(n => n + 1);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  /** Start session: spawn CLI + send first message */
  const startSession = useCallback(async (message: string, model?: string) => {
    // Add user message
    push({ type: 'user', text: message, ts: Date.now() });
    _isStreaming = true;
    notify();

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId: _sessionId || undefined,
          model,
        }),
      });

      if (!res.ok || !res.body) {
        push({ type: 'error', text: `HTTP ${res.status}`, ts: Date.now() });
        _isStreaming = false;
        notify();
        return;
      }

      // Consume SSE — each event becomes one ChatMsg
      await consumeSSE(res.body);

    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        push({ type: 'error', text: (err as Error).message, ts: Date.now() });
      }
    }

    _isStreaming = false;
    notify();
  }, []);

  /** Send follow-up message — spawns new process with --resume (same as claude-code-chat) */
  const sendMessage = useCallback(async (text: string) => {
    // Always start a new session with --resume sessionId
    // This is how claude-code-chat works: each message = new process
    return startSession(text);
  }, [startSession]);

  /** Respond to permission request */
  const respondPermission = useCallback(async (requestId: string, approved: boolean, alwaysAllow = false) => {
    if (!_internalId) return;

    // Find the original permission request to get input/suggestions/toolUseId
    const permMsg = _messages.find(m => m.type === 'permissionRequest' && m.id === requestId);
    const input = permMsg?.type === 'permissionRequest' ? permMsg.input : undefined;
    const suggestions = permMsg?.type === 'permissionRequest' ? permMsg.suggestions : undefined;
    const toolUseId = permMsg?.type === 'permissionRequest' ? permMsg.toolUseId : undefined;

    // Update UI
    _messages = _messages.map(m =>
      m.type === 'permissionRequest' && m.id === requestId
        ? { ...m, status: approved ? 'approved' as const : 'denied' as const }
        : m
    );
    persist();
    notify();

    console.log(`[respondPermission] internalId=${_internalId.slice(0, 8)} requestId=${requestId} allow=${approved} toolUseId=${toolUseId}`);
    const res = await fetch('/api/chat/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        internalId: _internalId,
        action: {
          type: 'permission',
          requestId,
          allow: approved,
          input,
          suggestions: alwaysAllow ? suggestions : undefined,
          toolUseId,
        },
      }),
    });
    const result = await res.json();
    console.log(`[respondPermission] response:`, result);
  }, []);

  return {
    messages: _messages,
    isStreaming: _isStreaming,
    sessionId: _sessionId,
    startSession,
    sendMessage,
    respondPermission,
    reset: resetStream,
  };
}

// ── SSE consumer (translates events to ChatMsg, no dedup) ──

async function consumeSSE(body: ReadableStream) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        if (!event.startsWith('data: ')) continue;
        try {
          const { type, data } = JSON.parse(event.slice(6));
          handleEvent(type, data);
        } catch { /* skip malformed */ }
      }
    }
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      push({ type: 'error', text: (err as Error).message, ts: Date.now() });
    }
  }
}

/** Handle one SSE event — strict translation of script.ts switch(message.type) */
function handleEvent(type: string, data: any) {
  const ts = Date.now();

  switch (type) {
    case 'session_start':
      _internalId = data.internalId;
      break;

    case 'sessionInfo':
      _sessionId = data.sessionId || _sessionId;
      persist();
      break;

    case 'output':
      if (typeof data === 'string' && data.trim()) {
        push({ type: 'output', text: data.trim(), ts });
      }
      break;

    case 'thinking':
      if (typeof data === 'string' && data.trim()) {
        push({ type: 'thinking', text: data.trim(), ts });
      }
      break;

    case 'toolUse':
      push({
        type: 'toolUse',
        toolName: data.toolName,
        toolInfo: data.toolInfo,
        rawInput: data.rawInput || {},
        ts,
      });
      break;

    case 'toolResult': {
      const content = data.content || 'Tool executed successfully';
      const isError = data.isError || false;
      // Hide Read/TodoWrite results unless error (same as claude-code-chat)
      const hidden = !isError && false; // Can enable hiding later
      push({
        type: 'toolResult',
        content,
        isError,
        toolUseId: data.toolUseId,
        hidden,
        ts,
      });
      break;
    }

    case 'permissionRequest':
      push({
        type: 'permissionRequest',
        id: data.id,
        tool: data.tool,
        input: data.input || {},
        suggestions: data.suggestions,
        toolUseId: data.toolUseId,
        status: 'pending',
        ts,
      });
      break;

    case 'error':
      if (data) {
        push({ type: 'error', text: typeof data === 'string' ? data : JSON.stringify(data), ts });
      }
      break;

    case 'result':
      _sessionId = data.sessionId || _sessionId;
      _isStreaming = false;
      persist();
      notify();
      break;

    case 'setProcessing':
      if (!data.isProcessing) {
        _isStreaming = false;
        notify();
      }
      break;
  }
}
