'use client';

import React, { useState } from 'react';
import { Layout, Menu, Typography, Tooltip } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ProjectOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  NodeIndexOutlined,
  ToolOutlined,
  AppstoreOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import { getAgentStats } from '@/data/agents';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/dashboard',  icon: <DashboardOutlined />,    label: '工作台' },
  { key: '/studio',     icon: <TeamOutlined />,          label: 'AI 工作室' },
  { key: '/generate',   icon: <ThunderboltOutlined />,   label: '游戏生成' },
  { key: '/workflows',  icon: <NodeIndexOutlined />,     label: '工作流' },
  { key: '/sprints',    icon: <ProjectOutlined />,       label: '冲刺管理' },
  { key: '/skills',     icon: <AppstoreOutlined />,      label: '技能' },
  { key: '/files',      icon: <FolderOutlined />,        label: '文件浏览' },
  { key: '/setup',      icon: <ToolOutlined />,          label: '引擎配置' },
  { key: '/settings',   icon: <SettingOutlined />,       label: '设置' },
];

// Routes that should NOT use the app shell (sidebar + header)
const STANDALONE_ROUTES = ['/'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const agentCount = getAgentStats().total;
  const activeKey = menuItems.find((item) => pathname.startsWith(item.key))?.key || '/dashboard';

  // Render children directly for landing/standalone pages
  if (STANDALONE_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#000' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={220}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0, top: 0, bottom: 0,
          zIndex: 100,
          background: '#000',
          borderRight: '1px solid #27272a',
        }}
      >
        {/* Logo — Runway-style wordmark */}
        <div
          style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 16px',
            borderBottom: '1px solid #27272a',
            gap: 8,
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: collapsed ? 14 : 15,
              fontWeight: 400,
              letterSpacing: '-0.9px',
              whiteSpace: 'nowrap',
            }}
          >
            {collapsed ? 'AI' : 'AI Game Studio'}
          </Text>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{ borderRight: 0, marginTop: 4, background: 'transparent' }}
        />

        {/* Status — subtle */}
        {!collapsed && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12, right: 12,
              fontSize: 11,
              color: '#767d88',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#27a644' }} />
            {agentCount} agents
          </div>
        )}
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s', background: '#000' }}>
        {/* Header — near-invisible */}
        <Header
          style={{
            padding: '0 20px',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #27272a',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            height: 48,
            lineHeight: '48px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Tooltip title={collapsed ? '展开' : '折叠'} mouseEnterDelay={0.3}>
              {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                onClick: () => setCollapsed(!collapsed),
                style: { fontSize: 15, cursor: 'pointer', color: '#767d88' },
              })}
            </Tooltip>
            <Text style={{ fontSize: 14, fontWeight: 400, letterSpacing: '-0.16px', color: '#f7f8f8', margin: 0 }}>
              {menuItems.find((i) => i.key === activeKey)?.label || 'AI Game Studio'}
            </Text>
          </div>
        </Header>

        <Content style={{ margin: 16, minHeight: 'calc(100vh - 80px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
