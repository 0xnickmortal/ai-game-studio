'use client';

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Button, Space, Tag, Progress, Steps, Alert } from 'antd';
import {
  RobotOutlined,
  ThunderboltOutlined,
  ProjectOutlined,
  TeamOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  BulbOutlined,
  CodeOutlined,
  AppstoreOutlined,
  RocketOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { AGENTS, getAgentStats } from '@/data/agents';

const { Title, Text, Paragraph } = Typography;

interface ProjectStatus {
  stage: string;
  hasEngineConfig: boolean;
  hasDesignDocs: boolean;
  hasSourceCode: boolean;
  hasTests: boolean;
  hasSprintData: boolean;
  hasReleaseData: boolean;
  hasGameConcept: boolean;
  details: string[];
  nextSteps: string[];
}

const ONBOARDING_STEPS = [
  { title: '配置引擎', icon: <SettingOutlined />, path: '/setup', key: 'hasEngineConfig' },
  { title: '头脑风暴', icon: <BulbOutlined />, path: '/skills', key: 'hasGameConcept' },
  { title: '系统设计', icon: <AppstoreOutlined />, path: '/skills', key: 'hasDesignDocs' },
  { title: '代码开发', icon: <CodeOutlined />, path: '/generate', key: 'hasSourceCode' },
  { title: '测试发布', icon: <RocketOutlined />, path: '/workflows', key: 'hasReleaseData' },
];

interface QuickAction {
  title: string;
  desc: string;
  icon: React.ReactNode;
  path: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: '配置引擎',
    desc: '选择 Godot / Unity / Unreal，配置语言和渲染器',
    icon: <SettingOutlined style={{ color: '#6366f1' }} />,
    path: '/setup',
  },
  {
    title: '生成新游戏',
    desc: '自然语言描述 → AI 生成可玩原型',
    icon: <ThunderboltOutlined style={{ color: '#10b981' }} />,
    path: '/generate',
  },
  {
    title: '浏览技能',
    desc: '37 个专业工作流，从头脑风暴到发布',
    icon: <AppstoreOutlined style={{ color: '#8b5cf6' }} />,
    path: '/skills',
  },
  {
    title: '与代理对话',
    desc: '选择一个 AI 代理开始协作',
    icon: <RobotOutlined style={{ color: '#3b82f6' }} />,
    path: '/studio',
  },
  {
    title: '规划冲刺',
    desc: '创建任务看板，管理开发进度',
    icon: <ProjectOutlined style={{ color: '#f59e0b' }} />,
    path: '/sprints',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const stats = getAgentStats();
  const [projectStatus, setProjectStatus] = useState<ProjectStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/project/status')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setProjectStatus(data))
      .catch((err) => {
        console.error('Failed to load project status:', err);
        setStatusError('无法加载项目状态');
      });
  }, []);

  const tierCounts = {
    directors: stats.tier1,
    leads: stats.tier2,
    specialists: stats.tier3,
  };

  const domains = [...new Set(AGENTS.map((a) => a.domain))];

  // Calculate onboarding progress
  const onboardingStep = projectStatus
    ? ONBOARDING_STEPS.findIndex(s => !projectStatus[s.key as keyof ProjectStatus])
    : 0;

  const isNewProject = !projectStatus || projectStatus.stage === 'fresh';

  return (
    <div>
      {/* Error loading status */}
      {statusError && (
        <Alert
          message={statusError}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Onboarding guide for new projects */}
      {isNewProject && (
        <Alert
          title="欢迎来到 AI Game Studio！"
          description="这是一个全新项目。按照以下步骤开始你的游戏开发之旅。"
          type="info"
          showIcon
          icon={<RocketOutlined />}
          style={{ marginBottom: 24 }}
          action={
            <Button type="primary" size="small" onClick={() => router.push('/setup')}>
              开始配置
            </Button>
          }
        />
      )}

      {/* Project status card (when detected) */}
      {projectStatus && projectStatus.stage !== 'fresh' && (
        <Card style={{ marginBottom: 24 }}>
          <Row align="middle" gutter={24}>
            <Col flex="auto">
              <Space>
                <Tag color={
                  projectStatus.stage === 'configured' ? '#6366f1' :
                  projectStatus.stage === 'concept' ? '#f59e0b' :
                  projectStatus.stage === 'pre-production' ? '#3b82f6' :
                  projectStatus.stage === 'production' ? '#10b981' :
                  '#94a3b8'
                } style={{ fontSize: 14, padding: '4px 12px' }}>
                  {projectStatus.stage}
                </Tag>
                {projectStatus.details.map((d, i) => (
                  <Tag key={i} icon={<CheckCircleOutlined />} color="success">{d}</Tag>
                ))}
              </Space>
            </Col>
          </Row>
          {projectStatus.nextSteps.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">推荐下一步：</Text>
              <Space style={{ marginLeft: 8 }}>
                {projectStatus.nextSteps.slice(0, 3).map((step, i) => (
                  <Tag key={i} color="blue">{step}</Tag>
                ))}
              </Space>
            </div>
          )}
        </Card>
      )}

      {/* Onboarding steps */}
      {projectStatus && (
        <Card style={{ marginBottom: 24 }}>
          <Steps
            current={onboardingStep === -1 ? ONBOARDING_STEPS.length : onboardingStep}
            size="small"
            items={ONBOARDING_STEPS.map((s, i) => ({
              title: s.title,
              icon: s.icon,
              status: projectStatus[s.key as keyof ProjectStatus]
                ? 'finish'
                : i === onboardingStep ? 'process' : 'wait',
              style: { cursor: 'pointer' },
            }))}
            onChange={(step) => router.push(ONBOARDING_STEPS[step].path)}
          />
        </Card>
      )}

      {/* Hero section */}
      <Card
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 50%, #0f172a 100%)',
          border: 'none',
        }}
      >
        <Row align="middle" gutter={24}>
          <Col flex="1">
            <Title level={2} style={{ color: '#e0e7ff', marginBottom: 8 }}>
              AI Game Studio
            </Title>
            <Paragraph style={{ color: '#a5b4fc', fontSize: 16, marginBottom: 20 }}>
              {stats.total} 个 AI 代理就绪，从创意构思到可玩原型，全程 AI 驱动
            </Paragraph>
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={() => router.push('/generate')}
              >
                开始生成游戏
              </Button>
              <Button
                size="large"
                icon={<TeamOutlined />}
                onClick={() => router.push('/studio')}
              >
                进入工作室
              </Button>
            </Space>
          </Col>
          <Col>
            <RobotOutlined style={{ fontSize: 120, color: '#4f46e5', opacity: 0.3 }} />
          </Col>
        </Row>
      </Card>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="AI 代理总数"
              value={stats.total}
              prefix={<RobotOutlined />}
              styles={{ content: { color: '#6366f1' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总监级"
              value={tierCounts.directors}
              prefix={<TeamOutlined />}
              suffix="位"
              styles={{ content: { color: '#f59e0b' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="负责人级"
              value={tierCounts.leads}
              prefix={<TeamOutlined />}
              suffix="位"
              styles={{ content: { color: '#3b82f6' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="专家级"
              value={tierCounts.specialists}
              prefix={<TeamOutlined />}
              suffix="位"
              styles={{ content: { color: '#10b981' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Engine specialist stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="通用代理"
              value={stats.universal}
              suffix="位"
              styles={{ content: { color: '#94a3b8' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable onClick={() => router.push('/setup')}>
            <Statistic
              title="Godot 专家"
              value={stats.godot}
              suffix="位"
              styles={{ content: { color: '#478cbf' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable onClick={() => router.push('/setup')}>
            <Statistic
              title="Unity 专家"
              value={stats.unity}
              suffix="位"
              styles={{ content: { color: '#888' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable onClick={() => router.push('/setup')}>
            <Statistic
              title="Unreal 专家"
              value={stats.unreal}
              suffix="位"
              styles={{ content: { color: '#2563eb' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick actions + Agent domains */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="快速开始">
            {QUICK_ACTIONS.map((item) => (
              <div
                key={item.path + item.title}
                onClick={() => router.push(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Space>
                  {item.icon}
                  <div>
                    <Text strong>{item.title}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>
                  </div>
                </Space>
                <PlayCircleOutlined />
              </div>
            ))}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="代理领域分布">
            {domains.map((domain) => {
              const count = AGENTS.filter((a) => a.domain === domain).length;
              const percent = Math.round((count / AGENTS.length) * 100);
              const colorMap: Record<string, string> = {
                engineering: '#3b82f6',
                design: '#8b5cf6',
                creative: '#ef4444',
                art: '#ec4899',
                narrative: '#f97316',
                audio: '#10b981',
                production: '#f59e0b',
                quality: '#6366f1',
              };
              return (
                <div key={domain} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Space>
                      <Tag color={colorMap[domain] || 'default'}>{domain}</Tag>
                      <Text type="secondary">{count} 位代理</Text>
                    </Space>
                    <Text type="secondary">{percent}%</Text>
                  </div>
                  <Progress
                    percent={percent}
                    showInfo={false}
                    strokeColor={colorMap[domain] || '#6366f1'}
                    size="small"
                  />
                </div>
              );
            })}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
