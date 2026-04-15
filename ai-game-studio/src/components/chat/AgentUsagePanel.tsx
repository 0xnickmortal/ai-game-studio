'use client';

import React, { useState } from 'react';
import { Card, Typography, Button, Space, Divider } from 'antd';
import { RobotOutlined, CaretDownOutlined, CaretUpOutlined, ReloadOutlined } from '@ant-design/icons';
import type { AgentCall, TokenUsage } from '@/lib/streaming/useClaudeStream';

const { Text } = Typography;

interface Props {
  agentCalls: AgentCall[];
  tokens: TokenUsage;
  onReset?: () => void;
}

// Rough Sonnet-4 pricing ($/MTok): input $3, output $15, cache read $0.30, cache write $3.75
function estimateCostUSD(t: TokenUsage): number {
  return (
    (t.inputTokens         * 3.00) +
    (t.outputTokens        * 15.00) +
    (t.cacheReadTokens     * 0.30) +
    (t.cacheCreationTokens * 3.75)
  ) / 1_000_000;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

export default function AgentUsagePanel({ agentCalls, tokens, onReset }: Props) {
  const [expanded, setExpanded] = useState(true);

  // Group by agent name
  const counts = new Map<string, number>();
  for (const c of agentCalls) counts.set(c.name, (counts.get(c.name) || 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  const totalCalls = agentCalls.length;
  const unique = sorted.length;
  const cost = estimateCostUSD(tokens);
  const hasActivity = totalCalls > 0 || tokens.inputTokens > 0 || tokens.outputTokens > 0;

  // Hide when idle
  if (!hasActivity) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 280,
        zIndex: 1000,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        borderRadius: 8,
      }}
    >
      <Card
        size="small"
        styles={{ body: { padding: expanded ? 12 : '8px 12px' } }}
        style={{ border: '1px solid #334155', background: '#0f172a' }}
        title={
          <Space size={6} style={{ fontSize: 12 }}>
            <RobotOutlined style={{ color: '#6366f1' }} />
            <Text strong style={{ fontSize: 12 }}>本次会话</Text>
          </Space>
        }
        extra={
          <Space size={4}>
            {onReset && (
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={onReset}
                title="重置计数"
                style={{ color: '#94a3b8' }}
              />
            )}
            <Button
              type="text"
              size="small"
              icon={expanded ? <CaretDownOutlined /> : <CaretUpOutlined />}
              onClick={() => setExpanded(!expanded)}
              style={{ color: '#94a3b8' }}
            />
          </Space>
        }
      >
        {expanded && (
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <div style={{ fontSize: 11, color: '#cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Agent 召唤</span>
                <Text strong style={{ fontSize: 11, color: '#a5b4fc' }}>
                  {totalCalls} 次 · {unique} 个独立
                </Text>
              </div>
            </div>

            {sorted.length > 0 && (
              <div
                style={{
                  maxHeight: 140,
                  overflowY: 'auto',
                  borderLeft: '2px solid #1e293b',
                  paddingLeft: 8,
                }}
              >
                {sorted.map(([name, count]) => (
                  <div
                    key={name}
                    style={{
                      fontSize: 10,
                      color: '#94a3b8',
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '1px 0',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      · {name}
                    </span>
                    {count > 1 && (
                      <Text style={{ fontSize: 10, color: '#6366f1' }}>{count}×</Text>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Divider style={{ margin: '4px 0', borderColor: '#1e293b' }} />

            <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Input</span>
                <span>{fmt(tokens.inputTokens)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Output</span>
                <span>{fmt(tokens.outputTokens)}</span>
              </div>
              {tokens.cacheReadTokens > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Cache hit</span>
                  <span>{fmt(tokens.cacheReadTokens)}</span>
                </div>
              )}
              {tokens.cacheCreationTokens > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Cache write</span>
                  <span>{fmt(tokens.cacheCreationTokens)}</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 4,
                  paddingTop: 4,
                  borderTop: '1px dashed #1e293b',
                }}
              >
                <Text strong style={{ fontSize: 10, color: '#cbd5e1' }}>预估</Text>
                <Text strong style={{ fontSize: 10, color: '#22c55e' }}>
                  ${cost.toFixed(4)}
                </Text>
              </div>
            </div>
          </Space>
        )}
      </Card>
    </div>
  );
}
