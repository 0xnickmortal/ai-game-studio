'use client';

import React, { useState, useCallback } from 'react';
import { Row, Col, Card, Avatar, Tag, Space, Typography, Input, Segmented, Drawer } from 'antd';
import { RobotOutlined, SearchOutlined, ApartmentOutlined, AppstoreOutlined, CodeOutlined } from '@ant-design/icons';
import { AGENTS, getAgentsByTier, getAgentsByEngine } from '@/data/agents';
import { AgentDef, ChatMessage } from '@/types';
import AgentChat from '@/components/chat/AgentChat';
import AgentGraph from '@/components/studio/AgentGraph';
import ClaudeTerminal from '@/components/terminal/ClaudeTerminal';
import ClaudeChat from '@/components/chat/ClaudeChat';

const { Text } = Typography;

export default function StudioPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentDef | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<string>('graph');
  const [engineFilter, setEngineFilter] = useState<string>('all');

  // First filter by engine
  const engineAgents = engineFilter === 'all'
    ? AGENTS
    : getAgentsByEngine(engineFilter as 'godot' | 'unity' | 'unreal');

  const filteredAgents = engineAgents.filter((a) => {
    const matchSearch =
      !search ||
      a.name.includes(search) ||
      a.id.includes(search.toLowerCase()) ||
      a.description.includes(search) ||
      a.domain.includes(search.toLowerCase());
    const matchTier = tierFilter === 'all' || a.tier === Number(tierFilter);
    return matchSearch && matchTier;
  });

  const openChat = useCallback((agent: AgentDef) => {
    setSelectedAgent(agent);
    setMessages([]);
    setChatOpen(true);
  }, []);

  const handleSend = useCallback(
    async (content: string) => {
      if (!selectedAgent) return;

      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        agentId: selectedAgent.id,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: selectedAgent.id,
            messages: [...messages, userMsg],
          }),
        });

        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-reply`,
          role: 'assistant',
          content: data.error ? `Error: ${data.error}` : data.reply,
          agentId: selectedAgent.id,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        const errorMsg: ChatMessage = {
          id: `msg-${Date.now()}-err`,
          role: 'assistant',
          content: 'Network error',
          agentId: selectedAgent.id,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [selectedAgent, messages]
  );

  const tiers = [
    { key: 1, label: '总监', color: '#f59e0b' },
    { key: 2, label: '负责人', color: '#3b82f6' },
    { key: 3, label: '专家', color: '#10b981' },
  ];

  return (
    <div>
      {/* Toolbar */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Segmented
            value={viewMode}
            onChange={(v) => setViewMode(v as string)}
            options={[
              { label: '层级图', value: 'graph', icon: <ApartmentOutlined /> },
              { label: '卡片列表', value: 'grid', icon: <AppstoreOutlined /> },
              { label: '对话', value: 'chat', icon: <CodeOutlined /> },
              { label: '终端', value: 'terminal', icon: <CodeOutlined /> },
            ]}
          />
          {viewMode === 'grid' && (
            <>
              <Input
                prefix={<SearchOutlined />}
                placeholder="搜索代理..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Segmented
                value={engineFilter}
                onChange={(v) => setEngineFilter(v as string)}
                options={[
                  { label: `全部 (${AGENTS.length})`, value: 'all' },
                  { label: `Godot`, value: 'godot' },
                  { label: `Unity`, value: 'unity' },
                  { label: `Unreal`, value: 'unreal' },
                ]}
              />
              <Segmented
                value={tierFilter}
                onChange={(v) => setTierFilter(v as string)}
                options={[
                  { label: `全部 (${engineAgents.length})`, value: 'all' },
                  { label: `总监 (${getAgentsByTier(1).length})`, value: '1' },
                  { label: `负责人 (${getAgentsByTier(2).length})`, value: '2' },
                  { label: `专家 (${getAgentsByTier(3).length})`, value: '3' },
                ]}
              />
            </>
          )}
        </Space>
      </Card>

      {/* Graph View */}
      {viewMode === 'graph' && (
        <Card styles={{ body: { padding: 0 } }}>
          <AgentGraph onAgentClick={openChat} />
        </Card>
      )}

      {/* Grid View */}
      {viewMode === 'grid' &&
        tiers.map(({ key, label, color }) => {
          const agents = filteredAgents.filter((a) => a.tier === key);
          if (agents.length === 0) return null;
          return (
            <div key={key} style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 12 }}>
                <Tag color={color} style={{ fontSize: 14, padding: '2px 12px' }}>
                  Tier {key} — {label}
                </Tag>
                <Text type="secondary" style={{ marginLeft: 8 }}>{agents.length} 位代理</Text>
              </div>
              <Row gutter={[12, 12]}>
                {agents.map((agent) => (
                  <Col key={agent.id} xs={24} sm={12} md={8} lg={6}>
                    <Card hoverable size="small" onClick={() => openChat(agent)} style={{ height: '100%' }}>
                      <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                        <Space>
                          <Avatar size={28} icon={<RobotOutlined />} style={{ backgroundColor: agent.color }} />
                          <Text strong style={{ fontSize: 13 }}>{agent.name}</Text>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 12 }} ellipsis>{agent.description}</Text>
                        <Space size={4} wrap>
                          <Tag style={{ fontSize: 11 }}>{agent.domain}</Tag>
                          <Tag color="purple" style={{ fontSize: 11 }}>{agent.model}</Tag>
                          {agent.engine && (
                            <Tag
                              color={agent.engine === 'godot' ? 'cyan' : agent.engine === 'unity' ? 'default' : 'blue'}
                              style={{ fontSize: 11 }}
                            >
                              {agent.engine}
                            </Tag>
                          )}
                        </Space>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          );
        })}

      {/* Chat View (claude-code-chat style) */}
      {viewMode === 'chat' && (
        <Card styles={{ body: { padding: 0, height: 'calc(100vh - 220px)' } }}>
          <ClaudeChat
            agentName="Creative Director"
            placeholder="Ask Claude Code anything..."
          />
        </Card>
      )}

      {/* Terminal View */}
      {viewMode === 'terminal' && (
        <Card styles={{ body: { padding: 0, height: 'calc(100vh - 220px)' } }}>
          <ClaudeTerminal cwd="F:/ClaudeGameTeam" />
        </Card>
      )}

      {/* Chat drawer */}
      <Drawer
        title={selectedAgent ? `与 ${selectedAgent.name} 对话` : '代理对话'}
        placement="right"
        size={520}
        onClose={() => setChatOpen(false)}
        open={chatOpen}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
      >
        {selectedAgent && (
          <AgentChat agent={selectedAgent} messages={messages} onSend={handleSend} loading={loading} />
        )}
      </Drawer>
    </div>
  );
}
