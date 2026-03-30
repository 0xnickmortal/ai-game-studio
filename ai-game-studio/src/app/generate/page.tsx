'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Tag, Typography, Button, Space, Alert, Spin } from 'antd';
import {
  BulbOutlined, ToolOutlined, PictureOutlined, AppstoreOutlined,
  CodeOutlined, RocketOutlined, ExperimentOutlined, SettingOutlined,
  BuildOutlined, PlayCircleOutlined, ReloadOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import ClaudeChat from '@/components/chat/ClaudeChat';
import GamePreview from '@/components/preview/GamePreview';

const { Text } = Typography;

const PHASES = [
  { key: 'start',      icon: <RocketOutlined />,     label: '入口引导',  cmd: '/start',              desc: '检测项目状态，引导你开始' },
  { key: 'brainstorm', icon: <BulbOutlined />,       label: '创意构思',  cmd: '/brainstorm',         desc: '从零到游戏概念文档' },
  { key: 'engine',     icon: <SettingOutlined />,    label: '引擎配置',  cmd: '/setup-engine godot', desc: '配置引擎 + 填充 API 参考' },
  { key: 'systems',    icon: <AppstoreOutlined />,   label: '系统拆解',  cmd: '/map-systems',        desc: '拆解为独立系统，标注依赖' },
  { key: 'design',     icon: <ToolOutlined />,       label: '系统设计',  cmd: '/design-system',      desc: '逐系统编写 GDD（循环执行）' },
  { key: 'art',        icon: <PictureOutlined />,    label: '美术方向',  cmd: '/team-level',         desc: '美术风格 + 关卡设计' },
  { key: 'prototype',  icon: <ExperimentOutlined />, label: '原型开发',  cmd: '/prototype',          desc: '快速原型，直接写代码到磁盘' },
  { key: 'code',       icon: <CodeOutlined />,       label: '正式开发',  cmd: '直接对话',             desc: '多 agent 协作实现完整游戏' },
];

type BuildState = 'idle' | 'checking' | 'ready' | 'building' | 'success' | 'failed';

export default function GeneratePage() {
  const [buildState, setBuildState] = useState<BuildState>('idle');
  const [buildError, setBuildError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [godotFiles, setGodotFiles] = useState<string[]>([]);

  // Poll for Godot project files
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/build/detect');
        if (res.ok) {
          const data = await res.json();
          if (data.found && data.files?.length > 0) {
            setGodotFiles(data.files);
            if (buildState === 'idle') setBuildState('ready');
          }
        }
      } catch { /* ignore */ }
    };
    check();
    const interval = setInterval(check, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [buildState]);

  const handleBuild = useCallback(async () => {
    setBuildState('building');
    setBuildError('');
    setPreviewUrl('');

    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectDir: godotFiles[0] ? godotFiles[0].replace(/\/[^/]+$/, '') : undefined,
        }),
      });
      const data = await res.json();

      if (data.success && data.previewUrl) {
        setBuildState('success');
        setPreviewUrl(data.previewUrl);
        setShowPreview(true);
      } else {
        setBuildState('failed');
        setBuildError(data.error || 'Build failed');
      }
    } catch (err) {
      setBuildState('failed');
      setBuildError((err as Error).message);
    }
  }, [godotFiles]);

  return (
    <div style={{ display: 'flex', gap: 12, height: 'calc(100vh - 100px)', overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
      {/* Left: Phase guide + Build */}
      <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card
          style={{ flex: 1, overflow: 'auto' }}
          styles={{ body: { padding: 8 } }}
          title={<Text strong style={{ fontSize: 13 }}>工作流程</Text>}
        >
          {PHASES.map((phase) => (
            <div
              key={phase.key}
              style={{
                padding: '8px 10px',
                marginBottom: 4,
                borderRadius: 6,
                borderLeft: '3px solid #334155',
              }}
              title={`运行: ${phase.cmd}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ color: '#6366f1', fontSize: 13 }}>{phase.icon}</span>
                <Text strong style={{ fontSize: 12 }}>{phase.label}</Text>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>{phase.desc}</div>
              <Tag style={{ fontSize: 10, padding: '0 4px', color: '#a5b4fc', background: '#1e1b4b', border: '1px solid #312e81' }}>
                {phase.cmd}
              </Tag>
            </div>
          ))}
        </Card>

        {/* Build & Preview panel */}
        {buildState !== 'idle' && (
          <Card
            styles={{ body: { padding: 12 } }}
            style={{ borderColor: buildState === 'success' ? '#22c55e' : buildState === 'ready' ? '#6366f1' : '#334155' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              <Text strong style={{ fontSize: 13 }}>
                <BuildOutlined style={{ marginRight: 6 }} />
                构建 & 试玩
              </Text>

              {buildState === 'ready' && (
                <>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    检测到 {godotFiles.length} 个 Godot 文件
                  </div>
                  <Button type="primary" icon={<BuildOutlined />} onClick={handleBuild} block size="small">
                    构建 Web 版本
                  </Button>
                </>
              )}

              {buildState === 'building' && (
                <div style={{ textAlign: 'center', padding: 8 }}>
                  <Spin size="small" />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>编译中...</div>
                </div>
              )}

              {buildState === 'success' && (
                <>
                  <Alert message="构建成功" type="success" showIcon style={{ fontSize: 12 }} />
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => setShowPreview(!showPreview)}
                    block
                    size="small"
                    style={{ background: '#22c55e', borderColor: '#22c55e' }}
                  >
                    {showPreview ? '隐藏预览' : '打开预览'}
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleBuild} block size="small">
                    重新构建
                  </Button>
                </>
              )}

              {buildState === 'failed' && (
                <>
                  <Alert message={buildError || '构建失败'} type="error" showIcon style={{ fontSize: 11 }} />
                  <Button icon={<ReloadOutlined />} onClick={handleBuild} block size="small">
                    重试
                  </Button>
                </>
              )}
            </Space>
          </Card>
        )}
      </div>

      {/* Right: Chat + optional Preview */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
        {/* Preview area (shown when build succeeds) */}
        {showPreview && previewUrl && (
          <Card
            styles={{ body: { padding: 0, height: 350, overflow: 'hidden' } }}
            style={{ flexShrink: 0 }}
            title={
              <Space>
                <PlayCircleOutlined />
                <span>游戏预览</span>
                <Tag color="success">运行中</Tag>
              </Space>
            }
            extra={<Button size="small" onClick={() => setShowPreview(false)}>关闭</Button>}
          >
            <GamePreview src={previewUrl} engineTag="Godot Web Export" />
          </Card>
        )}

        {/* Chat */}
        <Card
          style={{ flex: 1 }}
          styles={{ body: { padding: 0, height: showPreview ? 'calc(100vh - 500px)' : '100%' } }}
        >
          <ClaudeChat
            agentName="Claude Code"
            placeholder="输入你的游戏想法，或运行 /start 开始引导流程..."
            style={{ height: '100%' }}
          />
        </Card>
      </div>
    </div>
  );
}
