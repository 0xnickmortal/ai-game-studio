'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Avatar, Typography, Space, Tag, Spin, Empty, Card } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { AgentDef, ChatMessage } from '@/types';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface AgentChatProps {
  agent: AgentDef;
  messages: ChatMessage[];
  onSend: (content: string) => Promise<void>;
  loading?: boolean;
}

export default function AgentChat({ agent, messages, onSend, loading = false }: AgentChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const content = input.trim();
    setInput('');
    await onSend(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Agent header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Avatar
          size={40}
          icon={<RobotOutlined />}
          style={{ backgroundColor: agent.color || '#1890ff', flexShrink: 0 }}
        />
        <div>
          <Text strong>{agent.name}</Text>
          <br />
          <Space size={4}>
            <Tag color={agent.tier === 1 ? 'gold' : agent.tier === 2 ? 'blue' : 'default'}>
              T{agent.tier}
            </Tag>
            <Tag>{agent.domain}</Tag>
            <Tag color="purple">{agent.model}</Tag>
          </Space>
        </div>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {messages.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                开始与 <strong>{agent.name}</strong> 对话
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {agent.description}
                </Text>
              </span>
            }
          />
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: 10,
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <Avatar
                size={32}
                icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                style={{
                  backgroundColor: msg.role === 'user' ? '#1890ff' : agent.color || '#52c41a',
                  flexShrink: 0,
                }}
              />
              <Card
                size="small"
                style={{
                  maxWidth: '75%',
                  backgroundColor: msg.role === 'user' ? '#e6f7ff' : '#fafafa',
                  border: msg.role === 'user' ? '1px solid #91d5ff' : '1px solid #f0f0f0',
                }}
                styles={{ body: { padding: '8px 12px' } }}
              >
                <Paragraph
                  style={{ margin: 0, whiteSpace: 'pre-wrap' }}
                >
                  {msg.content}
                </Paragraph>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {new Date(msg.timestamp).toLocaleTimeString('zh-CN')}
                </Text>
              </Card>
            </div>
          ))
        )}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Avatar
              size={32}
              icon={<RobotOutlined />}
              style={{ backgroundColor: agent.color || '#52c41a' }}
            />
            <Spin size="small" />
            <Text type="secondary">{agent.name} 正在思考...</Text>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          gap: 8,
        }}
      >
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`向 ${agent.name} 发送消息... (Enter 发送, Shift+Enter 换行)`}
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
          disabled={!input.trim()}
        />
      </div>
    </div>
  );
}
