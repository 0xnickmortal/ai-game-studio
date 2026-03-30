'use client';

import React, { useState, useRef } from 'react';
import { Card, Row, Col, Typography, Button, Steps, Tag, Space, Input, Drawer } from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
  RobotOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { getWorkflowTemplates, WorkflowStep, WORKFLOW_TEMPLATES } from '@/lib/workflow/engine';
import { AGENTS } from '@/data/agents';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function WorkflowsPage() {
  const templates = getWorkflowTemplates();
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startWorkflow = async (key: string) => {
    const template = WORKFLOW_TEMPLATES[key];
    if (!template) return;

    setActiveWorkflow(key);
    const wfSteps = template.steps.map((s) => ({ ...s }));
    setSteps(wfSteps);
    setCurrentStep(0);
    setIsRunning(true);
    setDrawerOpen(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Execute steps sequentially
    let context = userInput || '(No specific input provided)';

    for (let i = 0; i < wfSteps.length; i++) {
      if (controller.signal.aborted) break;

      // Update step status to running
      setCurrentStep(i);
      setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: 'running' } : s)));

      try {
        const step = wfSteps[i];
        const prompt = `${step.prompt}\n\nContext from previous steps:\n${context}\n\nPlease provide your ${step.action} output. Be concise but thorough. Respond in Chinese.`;

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: step.agentId,
            messages: [{ id: `wf-${i}`, role: 'user', content: prompt, agentId: step.agentId, timestamp: Date.now() }],
          }),
          signal: controller.signal,
        });

        const data = await res.json();
        const output = data.reply || data.error || 'No output';

        // Update step with output
        setSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'completed', output } : s))
        );

        // Add output to context for next step
        context += `\n\n### ${step.action} (by ${step.agentId}):\n${output}`;
      } catch (err) {
        if ((err as Error).name === 'AbortError') break;
        setSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'failed', output: `错误: ${(err as Error).message}` } : s))
        );
        break;
      }
    }

    abortControllerRef.current = null;
    setIsRunning(false);
  };

  const retryStep = async (stepIndex: number) => {
    if (isRunning || !activeWorkflow) return;
    // Reset the failed step and re-run from it
    setSteps((prev) => prev.map((s, idx) => (idx >= stepIndex ? { ...s, status: 'pending', output: undefined } : s)));
    // Rebuild context from completed steps
    let context = userInput || '(No specific input provided)';
    steps.slice(0, stepIndex).forEach((s) => {
      if (s.output && s.status === 'completed') {
        context += `\n\n### ${s.action} (by ${s.agentId}):\n${s.output}`;
      }
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsRunning(true);

    const template = WORKFLOW_TEMPLATES[activeWorkflow];
    const wfSteps = template.steps;

    for (let i = stepIndex; i < wfSteps.length; i++) {
      if (controller.signal.aborted) break;
      setCurrentStep(i);
      setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: 'running' } : s)));

      try {
        const step = wfSteps[i];
        const prompt = `${step.prompt}\n\nContext from previous steps:\n${context}\n\nPlease provide your ${step.action} output. Be concise but thorough. Respond in Chinese.`;
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: step.agentId,
            messages: [{ id: `wf-retry-${i}`, role: 'user', content: prompt, agentId: step.agentId, timestamp: Date.now() }],
          }),
          signal: controller.signal,
        });
        const data = await res.json();
        const output = data.reply || data.error || 'No output';
        setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: 'completed', output } : s)));
        context += `\n\n### ${step.action} (by ${step.agentId}):\n${output}`;
      } catch (err) {
        if ((err as Error).name === 'AbortError') break;
        setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: 'failed', output: `错误: ${(err as Error).message}` } : s)));
        break;
      }
    }

    abortControllerRef.current = null;
    setIsRunning(false);
  };

  const stopWorkflow = () => {
    abortControllerRef.current?.abort();
    setIsRunning(false);
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleOutlined style={{ color: '#10b981' }} />;
      case 'running': return <LoadingOutlined style={{ color: '#3b82f6' }} />;
      case 'failed': return <ClockCircleOutlined style={{ color: '#ef4444' }} />;
      default: return <ClockCircleOutlined style={{ color: '#64748b' }} />;
    }
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>工作流引擎</Title>
            <Text type="secondary">多代理自动协作流水线</Text>
          </Col>
        </Row>
      </Card>

      {/* Input area */}
      <Card style={{ marginBottom: 16 }}>
        <Paragraph type="secondary">
          输入你的需求，选择工作流模板，AI 代理将按流程自动协作完成。
        </Paragraph>
        <TextArea
          rows={3}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="例如：设计一个回合制 RPG 战斗系统，包含技能树和元素相克..."
          style={{ marginBottom: 16 }}
        />
      </Card>

      {/* Workflow templates */}
      <Row gutter={[16, 16]}>
        {templates.map((wf) => (
          <Col key={wf.key} xs={24} sm={12} md={8}>
            <Card
              hoverable
              style={{
                height: '100%',
                border: activeWorkflow === wf.key ? '2px solid #6366f1' : undefined,
              }}
            >
              <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                <Title level={5} style={{ margin: 0 }}>{wf.name}</Title>
                <Text type="secondary" style={{ fontSize: 13 }}>{wf.description}</Text>

                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {wf.agents.map((agentId) => {
                    const agent = AGENTS.find((a) => a.id === agentId);
                    return agent ? (
                      <Tag
                        key={agentId}
                        style={{
                          fontSize: 11,
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

                <Tag>{wf.stepCount} 步</Tag>

                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => startWorkflow(wf.key)}
                  disabled={isRunning}
                  block
                >
                  {isRunning && activeWorkflow === wf.key ? '运行中...' : '启动工作流'}
                </Button>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Workflow execution drawer */}
      <Drawer
        title={
          <Space>
            <ThunderboltOutlined />
            <span>{activeWorkflow ? WORKFLOW_TEMPLATES[activeWorkflow]?.name : '工作流执行'}</span>
            {isRunning ? (
              <Tag color="blue" icon={<LoadingOutlined />}>运行中</Tag>
            ) : steps.some((s) => s.status === 'completed') ? (
              <Tag color="green" icon={<CheckCircleOutlined />}>已完成</Tag>
            ) : null}
          </Space>
        }
        placement="right"
        size={600}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          isRunning ? (
            <Button danger onClick={stopWorkflow}>停止</Button>
          ) : null
        }
      >
        <Steps
          orientation="vertical"
          current={currentStep}
          items={steps.map((step, idx) => {
            const agent = AGENTS.find((a) => a.id === step.agentId);
            return {
              title: (
                <Space>
                  <span>{step.action}</span>
                  {agent && (
                    <Tag
                      style={{
                        fontSize: 11,
                        borderColor: agent.color,
                        color: agent.color,
                        background: 'transparent',
                      }}
                    >
                      {agent.name}
                    </Tag>
                  )}
                </Space>
              ),
              description: step.output ? (
                <div>
                  <Card
                    size="small"
                    style={{
                      marginTop: 8,
                      maxHeight: 200,
                      overflow: 'auto',
                      background: step.status === 'completed' ? '#0f291a' : step.status === 'failed' ? '#291a1a' : '#1e293b',
                      border: step.status === 'completed' ? '1px solid #10b981' : step.status === 'failed' ? '1px solid #ef4444' : '1px solid #334155',
                    }}
                  >
                    <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 12, margin: 0 }}>
                      {step.output}
                    </Paragraph>
                  </Card>
                  {step.status === 'failed' && !isRunning && (
                    <Button
                      size="small"
                      type="primary"
                      danger
                      onClick={() => retryStep(idx)}
                      style={{ marginTop: 8 }}
                    >
                      从此步骤重试
                    </Button>
                  )}
                </div>
              ) : step.status === 'running' ? (
                <Text type="secondary">
                  <LoadingOutlined /> {agent?.name} 正在工作...
                </Text>
              ) : (
                <Text type="secondary">{step.prompt}</Text>
              ),
              icon: getStepIcon(step.status),
              status: step.status === 'completed' ? 'finish' : step.status === 'running' ? 'process' : step.status === 'failed' ? 'error' : 'wait',
            };
          })}
        />
      </Drawer>
    </div>
  );
}
