'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button, Space, Tag } from 'antd';
import { PlayCircleOutlined, PoweroffOutlined, ReloadOutlined } from '@ant-design/icons';

/** Dynamic import xterm to avoid SSR issues */
let Terminal: typeof import('@xterm/xterm').Terminal | null = null;
let FitAddon: typeof import('@xterm/addon-fit').FitAddon | null = null;

// Module-level: survives component unmount/remount
let _activeSessionId = '';

interface ClaudeTerminalProps {
  cwd?: string;
  style?: React.CSSProperties;
}

export default function ClaudeTerminal({ cwd, style }: ClaudeTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<InstanceType<typeof import('@xterm/xterm').Terminal> | null>(null);
  const fitRef = useRef<InstanceType<typeof import('@xterm/addon-fit').FitAddon> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string>('');

  const [status, setStatus] = useState<'idle' | 'connecting' | 'running' | 'exited'>('idle');
  const statusRef = useRef(status);
  statusRef.current = status;
  const [loaded, setLoaded] = useState(false);

  // Load xterm dynamically on client
  useEffect(() => {
    Promise.all([
      import('@xterm/xterm'),
      import('@xterm/addon-fit'),
    ]).then(([xtermMod, fitMod]) => {
      Terminal = xtermMod.Terminal;
      FitAddon = fitMod.FitAddon;
      setLoaded(true);
    });
  }, []);

  // Initialize terminal DOM
  useEffect(() => {
    if (!loaded || !Terminal || !FitAddon || !containerRef.current) return;
    if (termRef.current) return; // already initialized

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", Menlo, Monaco, monospace',
      theme: {
        background: '#0f172a',
        foreground: '#e2e8f0',
        cursor: '#6366f1',
        selectionBackground: '#334155',
        black: '#1e293b',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#6366f1',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#f1f5f9',
        brightBlack: '#475569',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#818cf8',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff',
      },
      allowProposedApi: true,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();

    termRef.current = term;
    fitRef.current = fit;

    // Handle user input → send to stdin
    term.onData((data) => {
      if (sessionIdRef.current && statusRef.current === 'running') {
        fetch('/api/terminal/input', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sessionIdRef.current, input: data }),
        }).catch(() => { /* ignore */ });
      }
    });

    // Resize on window resize
    const onResize = () => fit.fit();
    window.addEventListener('resize', onResize);
    const observer = new ResizeObserver(() => fit.fit());
    observer.observe(containerRef.current);

    // Auto-reconnect if there's an active session from before navigation
    if (_activeSessionId) {
      term.writeln('\x1b[33mReconnecting...\x1b[0m');
      reconnectSession(_activeSessionId);
    } else {
      term.writeln('\x1b[1;36m=== Claude Code - AI Game Studio ===\x1b[0m');
      term.writeln('');
      term.writeln('Click \x1b[1;32mStart\x1b[0m to launch a Claude Code session.');
    }

    return () => {
      window.removeEventListener('resize', onResize);
      observer.disconnect();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Read SSE stream and pipe to xterm */
  const consumeStream = useCallback(async (res: Response, isReconnect = false) => {
    const term = termRef.current;
    if (!term || !res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    setStatus('running');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const events = buf.split('\n\n');
        buf = events.pop() || '';

        for (const event of events) {
          if (!event.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(event.slice(6));
            if (data.type === 'start' || data.type === 'reconnect') {
              sessionIdRef.current = data.sessionId;
              _activeSessionId = data.sessionId;
            } else if (data.type === 'output') {
              term.write(data.data);
            } else if (data.type === 'exit') {
              term.writeln(`\n\x1b[33m[进程退出 code=${data.code}]\x1b[0m`);
              _activeSessionId = '';
              setStatus('exited');
            } else if (data.type === 'error') {
              term.writeln(`\n\x1b[31m[错误: ${data.message}]\x1b[0m`);
              setStatus('exited');
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        // SSE disconnected but process may still be alive — don't clear session
        term.writeln(`\n\x1b[33m[连接断开 — 切回此页面将自动重连]\x1b[0m`);
      }
    }
  }, []);

  /** Reconnect to an existing session */
  const reconnectSession = useCallback(async (sid: string) => {
    if (!termRef.current) return;
    const term = termRef.current;

    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    sessionIdRef.current = sid;

    try {
      const res = await fetch(`/api/terminal/stream?sessionId=${sid}`, { signal: abort.signal });
      if (!res.ok) {
        // Session gone — reset
        term.writeln('\x1b[31mSession expired.\x1b[0m');
        _activeSessionId = '';
        setStatus('exited');
        return;
      }
      await consumeStream(res, true);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        term.writeln(`\n\x1b[31m[重连失败]\x1b[0m`);
      }
    }
  }, [consumeStream]);

  /** Start a new session */
  const startSession = useCallback(async () => {
    if (!termRef.current) return;
    const term = termRef.current;

    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    term.clear();
    term.writeln('\x1b[33m正在连接 Claude Code...\x1b[0m\n');
    term.focus();
    setStatus('connecting');

    try {
      const res = await fetch('/api/terminal/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd }),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) {
        term.writeln(`\x1b[31m连接失败: HTTP ${res.status}\x1b[0m`);
        setStatus('exited');
        return;
      }

      await consumeStream(res);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        term.writeln(`\n\x1b[31m[连接断开]\x1b[0m`);
      }
      setStatus('exited');
    }
  }, [cwd, consumeStream]);

  const stopSession = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    sessionIdRef.current = '';
    _activeSessionId = '';
    setStatus('exited');
    termRef.current?.writeln('\n\x1b[33m[会话已终止]\x1b[0m');
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', ...style }}>
      {/* Toolbar */}
      <div style={{
        padding: '8px 12px',
        background: '#1e293b',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Space>
          <Tag color={status === 'running' ? 'green' : status === 'connecting' ? 'orange' : 'default'}>
            {status === 'idle' ? '就绪' : status === 'connecting' ? '连接中' : status === 'running' ? '运行中' : '已退出'}
          </Tag>
        </Space>
        <Space>
          {(status === 'idle' || status === 'exited') && (
            <Button
              type="primary"
              size="small"
              icon={status === 'exited' ? <ReloadOutlined /> : <PlayCircleOutlined />}
              onClick={startSession}
            >
              {status === 'exited' ? '重启' : 'Start'}
            </Button>
          )}
          {status === 'running' && (
            <Button size="small" danger icon={<PoweroffOutlined />} onClick={stopSession}>
              终止
            </Button>
          )}
        </Space>
      </div>

      {/* Terminal */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          background: '#0f172a',
          padding: 4,
          minHeight: 400,
        }}
      />
    </div>
  );
}
