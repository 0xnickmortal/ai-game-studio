'use client';

import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Tag, Alert, Badge } from 'antd';
import { CheckCircleOutlined, ApiOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function SettingsPage() {
  const [cliStatus, setCliStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [cliVersion, setCliVersion] = useState('');

  useEffect(() => {
    // Check if Claude CLI is accessible via our API
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        if (data.cliAvailable) {
          setCliStatus('ok');
          setCliVersion(data.cliVersion || '');
        } else {
          setCliStatus('error');
        }
      })
      .catch(() => setCliStatus('error'));
  }, []);

  return (
    <div style={{ maxWidth: 700 }}>
      <Card
        title={<Space><ThunderboltOutlined /> Claude Code 集成</Space>}
        style={{ marginBottom: 24 }}
      >
        <Alert
          title="使用 Claude Code 授权"
          description="本平台直接使用 Claude Code CLI 的已登录授权，无需单独配置 API Key。确保你已通过 claude 命令行登录即可。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
          <Text strong>CLI 状态：</Text>
          {cliStatus === 'checking' && <Badge status="processing" text="检测中..." />}
          {cliStatus === 'ok' && (
            <Space>
              <Badge status="success" text="已连接" />
              <Tag color="green" icon={<CheckCircleOutlined />}>
                Claude Code {cliVersion}
              </Tag>
            </Space>
          )}
          {cliStatus === 'error' && (
            <Badge status="error" text="未检测到 Claude Code CLI" />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
          <Text strong>认证方式：</Text>
          <Tag color="purple" icon={<ApiOutlined />}>Claude Code OAuth</Tag>
          <Text type="secondary">（复用 CLI 登录态）</Text>
        </div>
      </Card>

      <Card title="关于" style={{ marginBottom: 24 }}>
        <Space orientation="vertical">
          <Text><strong>AI Game Studio</strong> v0.1.0 — MVP</Text>
          <Text type="secondary">
            基于 Claude Code Game Studios 的 AI 代理，提供可视化的游戏开发管理和 AI 驱动的游戏生成。
            直接通过 Claude Code CLI 调用，无需额外 API Key。
          </Text>
          <Space>
            <Tag color="blue">Next.js 14</Tag>
            <Tag color="purple">Ant Design</Tag>
            <Tag color="cyan">Claude Code CLI</Tag>
            <Tag>TypeScript</Tag>
          </Space>
        </Space>
      </Card>
    </div>
  );
}
