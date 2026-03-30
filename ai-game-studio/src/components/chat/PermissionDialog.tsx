'use client';

import React, { useState } from 'react';
import { Modal, Button, Typography, Space, Tag } from 'antd';
import { SafetyOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface PermissionDialogProps {
  sessionId: string;
  message: string;
  onResolved: () => void;
}

export default function PermissionDialog({ sessionId, message, onResolved }: PermissionDialogProps) {
  const [loading, setLoading] = useState<'allow' | 'deny' | null>(null);

  const sendResponse = async (response: 'yes' | 'no') => {
    setLoading(response === 'yes' ? 'allow' : 'deny');
    try {
      await fetch('/api/chat/permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, response }),
      });
    } catch (err) {
      console.error('[Permission] Failed to send:', err);
    } finally {
      setLoading(null);
      onResolved();
    }
  };

  return (
    <Modal
      open
      title={
        <Space>
          <SafetyOutlined style={{ color: '#f59e0b' }} />
          <span>权限请求</span>
        </Space>
      }
      closable={false}
      maskClosable={false}
      footer={null}
      width={520}
      style={{ top: 200 }}
    >
      <div style={{ marginBottom: 16 }}>
        <Tag color="warning" style={{ marginBottom: 8 }}>Agent 请求执行以下操作</Tag>
        <Paragraph
          style={{
            background: '#0f172a',
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid #334155',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: '#e2e8f0',
            fontSize: 13,
            lineHeight: 1.6,
            maxHeight: 300,
            overflow: 'auto',
          }}
        >
          {message}
        </Paragraph>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <Button
          danger
          icon={<CloseCircleOutlined />}
          loading={loading === 'deny'}
          onClick={() => sendResponse('no')}
        >
          Deny
        </Button>
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          loading={loading === 'allow'}
          onClick={() => sendResponse('yes')}
          style={{ background: '#16a34a', borderColor: '#16a34a' }}
        >
          Allow
        </Button>
      </div>
    </Modal>
  );
}
