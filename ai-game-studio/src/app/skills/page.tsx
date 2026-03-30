'use client';

import React, { useState } from 'react';
import {
  Card, Row, Col, Typography, Button, Space, Tag, Input,
  Drawer, Segmented, Result,
} from 'antd';
import {
  PlayCircleOutlined,
  RobotOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { SKILLS, SKILL_CATEGORIES } from '@/data/skills';
import { AGENTS } from '@/data/agents';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function SkillsPage() {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [skillOutput, setSkillOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredSkills = SKILLS.filter(s => {
    const matchCat = categoryFilter === 'all' || s.category === categoryFilter;
    const matchSearch = !search ||
      s.name.includes(search) ||
      s.id.includes(search.toLowerCase()) ||
      s.description.includes(search);
    return matchCat && matchSearch;
  });

  const openSkill = (skillId: string) => {
    setSelectedSkill(skillId);
    setSkillInput('');
    setSkillOutput('');
    setDrawerOpen(true);
  };

  const runSkill = async () => {
    if (!selectedSkill) return;
    const skill = SKILLS.find(s => s.id === selectedSkill);
    if (!skill) return;
    if (skill.requiresInput && !skillInput.trim()) return;

    setRunning(true);
    setSkillOutput('');

    try {
      // Use the primary agent for skill execution
      const agentId = skill.agents[0] || 'producer';
      const prompt = skillInput
        ? `Execute skill "/${skill.id}": ${skill.description}\n\nUser input: ${skillInput}\n\nPlease provide comprehensive output. Respond in Chinese.`
        : `Execute skill "/${skill.id}": ${skill.description}\n\nPlease provide comprehensive output based on the current project state. Respond in Chinese.`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          messages: [{
            id: `skill-${Date.now()}`,
            role: 'user',
            content: prompt,
            agentId,
            timestamp: Date.now(),
          }],
        }),
      });

      const data = await res.json();
      setSkillOutput(data.reply || data.error || 'No output');
    } catch (err) {
      setSkillOutput(`执行失败: ${err}`);
    } finally {
      setRunning(false);
    }
  };

  const currentSkill = selectedSkill ? SKILLS.find(s => s.id === selectedSkill) : null;

  const categories = Object.entries(SKILL_CATEGORIES);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>技能库</Title>
            <Text type="secondary">37 个专业技能工作流 — 从头脑风暴到发布上线</Text>
          </Col>
          <Col>
            <Space>
              <Input
                prefix={<SearchOutlined />}
                placeholder="搜索技能..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Segmented
          value={categoryFilter}
          onChange={v => setCategoryFilter(v as string)}
          options={[
            { label: `全部 (${SKILLS.length})`, value: 'all' },
            ...categories.map(([key, cat]) => ({
              label: `${cat.label} (${SKILLS.filter(s => s.category === key).length})`,
              value: key,
            })),
          ]}
        />
      </Card>

      {/* Skills grouped by category */}
      {(categoryFilter === 'all' ? categories : categories.filter(([k]) => k === categoryFilter)).map(([catKey, cat]) => {
        const skills = filteredSkills.filter(s => s.category === catKey);
        if (skills.length === 0) return null;
        return (
          <div key={catKey} style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 12 }}>
              <Tag color={cat.color} style={{ fontSize: 14, padding: '2px 12px' }}>
                {cat.label}
              </Tag>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                {skills.length} 个技能
              </Text>
            </div>
            <Row gutter={[12, 12]}>
              {skills.map(skill => (
                <Col key={skill.id} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    hoverable
                    size="small"
                    onClick={() => openSkill(skill.id)}
                    style={{ height: '100%' }}
                  >
                    <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                      <Text strong style={{ fontSize: 13 }}>/{skill.id}</Text>
                      <Text style={{ fontSize: 13 }}>{skill.name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                        {skill.description}
                      </Text>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {skill.agents.slice(0, 3).map(agentId => {
                          const agent = AGENTS.find(a => a.id === agentId);
                          return agent ? (
                            <Tag
                              key={agentId}
                              style={{
                                fontSize: 10,
                                borderColor: agent.color,
                                color: agent.color,
                                background: 'transparent',
                                padding: '0 4px',
                              }}
                            >
                              <RobotOutlined /> {agent.name}
                            </Tag>
                          ) : null;
                        })}
                        {skill.agents.length > 3 && (
                          <Tag style={{ fontSize: 10 }}>+{skill.agents.length - 3}</Tag>
                        )}
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        );
      })}

      {/* Skill execution drawer */}
      <Drawer
        title={
          <Space>
            <span>/{currentSkill?.id}</span>
            <span>{currentSkill?.name}</span>
            {running && <Tag color="blue" icon={<LoadingOutlined />}>运行中</Tag>}
            {skillOutput && !running && <Tag color="green" icon={<CheckCircleOutlined />}>已完成</Tag>}
          </Space>
        }
        placement="right"
        size={600}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {currentSkill && (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Paragraph type="secondary">{currentSkill.description}</Paragraph>

            <div>
              <Text strong>参与代理：</Text>
              <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {currentSkill.agents.map(agentId => {
                  const agent = AGENTS.find(a => a.id === agentId);
                  return agent ? (
                    <Tag
                      key={agentId}
                      style={{
                        borderColor: agent.color,
                        color: agent.color,
                        background: 'transparent',
                      }}
                    >
                      <RobotOutlined /> {agent.name}
                    </Tag>
                  ) : null;
                })}
              </div>
            </div>

            {(currentSkill.requiresInput || currentSkill.inputHint) && (
              <div>
                <Text strong>输入：</Text>
                {currentSkill.inputHint && (
                  <Text type="secondary" style={{ marginLeft: 8 }}>{currentSkill.inputHint}</Text>
                )}
                <TextArea
                  rows={4}
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  placeholder={currentSkill.inputHint || '输入内容（可选）...'}
                  style={{ marginTop: 8 }}
                />
              </div>
            )}

            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={runSkill}
              loading={running}
              disabled={currentSkill.requiresInput && !skillInput.trim()}
              block
              size="large"
            >
              {running ? '执行中...' : `执行 /${currentSkill.id}`}
            </Button>

            {skillOutput && (
              <Card
                size="small"
                title="执行结果"
                style={{
                  background: '#0f291a',
                  border: '1px solid #10b981',
                }}
              >
                <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 13, margin: 0 }}>
                  {skillOutput}
                </Paragraph>
              </Card>
            )}

            {!skillOutput && !running && (
              <Result
                icon={<PlayCircleOutlined style={{ color: '#6366f1', opacity: 0.3 }} />}
                title="点击执行按钮运行此技能"
                subTitle="技能将通过 Claude Code CLI 调用对应的 AI 代理"
              />
            )}
          </Space>
        )}
      </Drawer>
    </div>
  );
}
