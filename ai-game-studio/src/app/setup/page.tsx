'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, Steps, Row, Col, Typography, Button, Space, Tag,
  Select, InputNumber, Input, Result, Descriptions, Divider,
} from 'antd';
import {
  SettingOutlined,
  CodeOutlined,
  FormatPainterOutlined,
  ThunderboltOutlined,
  FontSizeOutlined,
  DashboardOutlined,
  CheckCircleOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { EngineConfig, ENGINE_OPTIONS, DEFAULT_CONFIG } from '@/lib/config/engine';
import { GameEngine } from '@/types';

const { Title, Text, Paragraph } = Typography;

const STEP_ITEMS = [
  { title: '选择引擎', icon: <SettingOutlined /> },
  { title: '编程语言', icon: <CodeOutlined /> },
  { title: '渲染 & 物理', icon: <FormatPainterOutlined /> },
  { title: '命名规范', icon: <FontSizeOutlined /> },
  { title: '性能预算', icon: <DashboardOutlined /> },
  { title: '确认保存', icon: <CheckCircleOutlined /> },
];

export default function SetupPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [config, setConfig] = useState<EngineConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load existing config
  useEffect(() => {
    fetch('/api/config')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.engine) setConfig(data);
      })
      .catch((err) => {
        console.error('Failed to load engine config:', err);
      });
  }, []);

  const selectedEngine = config.engine ? ENGINE_OPTIONS[config.engine] : null;

  const next = () => setCurrent(s => Math.min(s + 1, STEP_ITEMS.length - 1));
  const prev = () => setCurrent(s => Math.max(s - 1, 0));

  const defaultVersions: Record<GameEngine, string> = {
    godot: '4.5',
    unity: '2022.3',
    unreal: '5.4',
  };

  const selectEngine = (engine: GameEngine) => {
    const opt = ENGINE_OPTIONS[engine];
    setConfig({
      ...config,
      engine,
      engineVersion: config.engineVersion || defaultVersions[engine],
      language: opt.languages[0],
      rendering: opt.renderers[0],
      physics: opt.physics[0],
      namingConventions: { ...opt.defaultNaming },
    });
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      setSaved(true);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <Card>
        <Result
          status="success"
          title="引擎配置完成！"
          subTitle={`已配置 ${selectedEngine?.label} ${config.engineVersion || ''} + ${config.language}。配置已保存到 technical-preferences.md。`}
          extra={[
            <Button key="studio" type="primary" icon={<RocketOutlined />} onClick={() => router.push('/studio')}>
              进入工作室
            </Button>,
            <Button key="generate" icon={<ThunderboltOutlined />} onClick={() => router.push('/generate')}>
              生成游戏
            </Button>,
          ]}
        />
      </Card>
    );
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>引擎配置</Title>
        <Text type="secondary">配置游戏引擎、语言、渲染器和开发规范</Text>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Steps
          current={current}
          size="small"
          items={STEP_ITEMS.map(s => ({ title: s.title, icon: s.icon }))}
        />
      </Card>

      <Card style={{ minHeight: 400 }}>
        {/* Step 0: Choose engine */}
        {current === 0 && (
          <div>
            <Title level={5}>选择游戏引擎</Title>
            <Paragraph type="secondary">
              选择后将自动加载对应引擎的专家代理（4-5个引擎专家 + 34个通用代理）。
            </Paragraph>
            <Row gutter={16}>
              {(Object.entries(ENGINE_OPTIONS) as [GameEngine, typeof ENGINE_OPTIONS['godot']][]).map(([key, opt]) => (
                <Col key={key} span={8}>
                  <Card
                    hoverable
                    onClick={() => selectEngine(key)}
                    style={{
                      border: config.engine === key ? '2px solid #6366f1' : undefined,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 48, marginBottom: 12 }}>{opt.icon}</div>
                    <Title level={4} style={{ margin: 0 }}>{opt.label}</Title>
                    <Paragraph type="secondary" style={{ marginTop: 8 }}>
                      {opt.description}
                    </Paragraph>
                    <div style={{ marginTop: 12 }}>
                      {opt.languages.map(l => (
                        <Tag key={l} style={{ marginBottom: 4 }}>{l}</Tag>
                      ))}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            {config.engine && (
              <div style={{ marginTop: 24 }}>
                <Text strong>引擎版本</Text>
                <Input
                  value={config.engineVersion || ''}
                  onChange={e => setConfig({ ...config, engineVersion: e.target.value })}
                  placeholder="例如: 4.5"
                  style={{ width: 200, marginLeft: 12 }}
                />
                <Text type="secondary" style={{ marginLeft: 12, fontSize: 12 }}>
                  输入你本机安装的版本号
                </Text>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Language */}
        {current === 1 && selectedEngine && (
          <div>
            <Title level={5}>编程语言</Title>
            <Paragraph type="secondary">
              选择主要编程语言。这将影响代码生成和代理的建议风格。
            </Paragraph>
            <Select
              value={config.language}
              onChange={v => setConfig({ ...config, language: v })}
              style={{ width: 400 }}
              size="large"
              options={selectedEngine.languages.map(l => ({ label: l, value: l }))}
            />
          </div>
        )}

        {/* Step 2: Rendering & Physics */}
        {current === 2 && selectedEngine && (
          <div>
            <Title level={5}>渲染器 & 物理引擎</Title>
            <Row gutter={24}>
              <Col span={12}>
                <Text strong>渲染管线</Text>
                <Select
                  value={config.rendering}
                  onChange={v => setConfig({ ...config, rendering: v })}
                  style={{ width: '100%', marginTop: 8 }}
                  size="large"
                  options={selectedEngine.renderers.map(r => ({ label: r, value: r }))}
                />
              </Col>
              <Col span={12}>
                <Text strong>物理引擎</Text>
                <Select
                  value={config.physics}
                  onChange={v => setConfig({ ...config, physics: v })}
                  style={{ width: '100%', marginTop: 8 }}
                  size="large"
                  options={selectedEngine.physics.map(p => ({ label: p, value: p }))}
                />
              </Col>
            </Row>
          </div>
        )}

        {/* Step 3: Naming Conventions */}
        {current === 3 && (
          <div>
            <Title level={5}>命名规范</Title>
            <Paragraph type="secondary">
              已根据引擎最佳实践预填，可自行调整。
            </Paragraph>
            <Row gutter={[16, 16]}>
              {Object.entries(config.namingConventions).map(([key, value]) => {
                const labels: Record<string, string> = {
                  classes: '类名',
                  variables: '变量名',
                  signals: '信号/事件',
                  files: '文件名',
                  scenes: '场景/预制体',
                  constants: '常量',
                };
                return (
                  <Col key={key} span={12}>
                    <Text strong>{labels[key] || key}</Text>
                    <Input
                      value={value}
                      onChange={e => setConfig({
                        ...config,
                        namingConventions: {
                          ...config.namingConventions,
                          [key]: e.target.value,
                        },
                      })}
                      style={{ marginTop: 4 }}
                    />
                  </Col>
                );
              })}
            </Row>
          </div>
        )}

        {/* Step 4: Performance Budgets */}
        {current === 4 && (
          <div>
            <Title level={5}>性能预算</Title>
            <Paragraph type="secondary">
              设置性能目标，代理将在代码审查和优化建议中参考这些值。
            </Paragraph>
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Text strong>目标帧率 (FPS)</Text>
                <InputNumber
                  value={config.performanceBudgets.targetFps}
                  onChange={v => setConfig({
                    ...config,
                    performanceBudgets: {
                      ...config.performanceBudgets,
                      targetFps: v || 60,
                      frameBudgetMs: 1000 / (v || 60),
                    },
                  })}
                  style={{ width: '100%', marginTop: 4 }}
                  min={30}
                  max={240}
                  addonAfter="FPS"
                />
              </Col>
              <Col span={12}>
                <Text strong>帧预算</Text>
                <InputNumber
                  value={Number(config.performanceBudgets.frameBudgetMs.toFixed(2))}
                  disabled
                  style={{ width: '100%', marginTop: 4 }}
                  addonAfter="ms"
                />
              </Col>
              <Col span={12}>
                <Text strong>最大 Draw Calls</Text>
                <InputNumber
                  value={config.performanceBudgets.maxDrawCalls}
                  onChange={v => setConfig({
                    ...config,
                    performanceBudgets: {
                      ...config.performanceBudgets,
                      maxDrawCalls: v || 2000,
                    },
                  })}
                  style={{ width: '100%', marginTop: 4 }}
                  min={100}
                  max={10000}
                  step={100}
                />
              </Col>
              <Col span={12}>
                <Text strong>内存上限</Text>
                <InputNumber
                  value={config.performanceBudgets.memoryCeilingMb}
                  onChange={v => setConfig({
                    ...config,
                    performanceBudgets: {
                      ...config.performanceBudgets,
                      memoryCeilingMb: v || 2048,
                    },
                  })}
                  style={{ width: '100%', marginTop: 4 }}
                  min={256}
                  max={16384}
                  step={256}
                  addonAfter="MB"
                />
              </Col>
            </Row>
          </div>
        )}

        {/* Step 5: Confirm */}
        {current === 5 && selectedEngine && (
          <div>
            <Title level={5}>确认配置</Title>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="引擎">{selectedEngine.label} {config.engineVersion}</Descriptions.Item>
              <Descriptions.Item label="语言">{config.language}</Descriptions.Item>
              <Descriptions.Item label="渲染器">{config.rendering}</Descriptions.Item>
              <Descriptions.Item label="物理">{config.physics}</Descriptions.Item>
              <Descriptions.Item label="帧率目标">{config.performanceBudgets.targetFps} FPS</Descriptions.Item>
              <Descriptions.Item label="内存上限">{config.performanceBudgets.memoryCeilingMb} MB</Descriptions.Item>
              <Descriptions.Item label="Draw Calls">&lt; {config.performanceBudgets.maxDrawCalls}</Descriptions.Item>
              <Descriptions.Item label="帧预算">{config.performanceBudgets.frameBudgetMs.toFixed(2)} ms</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5}>命名规范</Title>
            <Descriptions bordered column={2} size="small">
              {Object.entries(config.namingConventions).map(([key, value]) => (
                <Descriptions.Item key={key} label={key}>{value}</Descriptions.Item>
              ))}
            </Descriptions>
          </div>
        )}

        {/* Navigation */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={prev} disabled={current === 0}>
            上一步
          </Button>
          <Space>
            {current < 5 ? (
              <Button type="primary" onClick={next} disabled={!config.engine}>
                下一步
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={saveConfig}
                loading={saving}
                size="large"
              >
                保存配置
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
}
