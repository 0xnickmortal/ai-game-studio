'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button, Space, Typography, Tag } from 'antd';
import {
  PlayCircleOutlined,
  ReloadOutlined,
  DownloadOutlined,
  ExpandOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface GamePreviewProps {
  /** Inline HTML code to write into iframe (HTML5 mode) */
  htmlCode?: string;
  /** URL to load in iframe (Godot web export mode) */
  src?: string;
  /** Game title */
  title?: string;
  /** Engine tag to show (default: "HTML5 Canvas") */
  engineTag?: string;
}

export default function GamePreview({ htmlCode, src, title, engineTag }: GamePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isUrlMode = !!src;
  const tag = engineTag || (isUrlMode ? 'Godot Web' : 'HTML5 Canvas');
  const tagColor = isUrlMode ? 'cyan' : 'green';

  const runGame = () => {
    if (!iframeRef.current) return;

    if (isUrlMode) {
      // URL mode: set iframe src
      iframeRef.current.src = src!;
      setIsRunning(true);
    } else if (htmlCode) {
      // HTML mode: write directly
      const doc = iframeRef.current.contentDocument;
      if (!doc) return;
      doc.open();
      doc.write(htmlCode);
      doc.close();
      setIsRunning(true);
    }
  };

  const stopGame = () => {
    if (!iframeRef.current) return;

    if (isUrlMode) {
      iframeRef.current.src = 'about:blank';
    } else {
      const doc = iframeRef.current.contentDocument;
      if (!doc) return;
      doc.open();
      doc.write('<html><body style="background:#0f172a;color:#64748b;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><p>Game stopped</p></body></html>');
      doc.close();
    }
    setIsRunning(false);
  };

  const downloadGame = () => {
    if (htmlCode) {
      const blob = new Blob([htmlCode], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'game'}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
    // For URL mode, downloading is more complex (multiple files)
    // Could be a future feature
  };

  const toggleFullscreen = () => {
    if (!iframeRef.current) return;
    if (!document.fullscreenElement) {
      iframeRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (htmlCode || src) runGame();
    const iframe = iframeRef.current;
    return () => {
      // Cleanup: clear iframe on unmount
      if (iframe) {
        iframe.src = 'about:blank';
      }
    };
    // Run only when content source changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlCode, src]);

  // For URL mode, use different sandbox attributes
  // Godot web needs allow-same-origin for wasm fetch
  const sandboxAttrs = isUrlMode
    ? 'allow-scripts allow-same-origin'
    : 'allow-scripts';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Controls */}
      <div
        style={{
          padding: '8px 12px',
          background: '#111827',
          borderRadius: '8px 8px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space>
          <Tag color={tagColor}>{tag}</Tag>
          {title && <Text style={{ color: '#94a3b8', fontSize: 13 }}>{title}</Text>}
        </Space>
        <Space>
          {isRunning ? (
            <Button size="small" icon={<PauseCircleOutlined />} onClick={stopGame}>
              停止
            </Button>
          ) : (
            <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={runGame}>
              运行
            </Button>
          )}
          <Button size="small" icon={<ReloadOutlined />} onClick={runGame}>
            重载
          </Button>
          <Button size="small" icon={<ExpandOutlined />} onClick={toggleFullscreen} />
          {htmlCode && (
            <Button size="small" icon={<DownloadOutlined />} onClick={downloadGame}>
              下载
            </Button>
          )}
        </Space>
      </div>

      {/* Game iframe */}
      <iframe
        ref={iframeRef}
        sandbox={sandboxAttrs}
        style={{
          width: '100%',
          flex: 1,
          minHeight: 500,
          border: '1px solid #1e293b',
          borderRadius: '0 0 8px 8px',
          background: '#000',
        }}
        title="Game Preview"
      />
    </div>
  );
}
