'use client';

import React, { useState } from 'react';
import { Layout, Menu, theme, Typography, Avatar, Tooltip } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ProjectOutlined,
  SettingOutlined,
  RobotOutlined,
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
const { Title } = Typography;

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '工作台',
  },
  {
    key: '/studio',
    icon: <TeamOutlined />,
    label: 'AI 工作室',
  },
  {
    key: '/generate',
    icon: <ThunderboltOutlined />,
    label: '游戏生成',
  },
  {
    key: '/workflows',
    icon: <NodeIndexOutlined />,
    label: '工作流',
  },
  {
    key: '/sprints',
    icon: <ProjectOutlined />,
    label: '冲刺管理',
  },
  {
    key: '/skills',
    icon: <AppstoreOutlined />,
    label: '技能',
  },
  {
    key: '/files',
    icon: <FolderOutlined />,
    label: '文件浏览',
  },
  {
    key: '/setup',
    icon: <ToolOutlined />,
    label: '引擎配置',
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '设置',
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { token } = theme.useToken();
  const agentCount = getAgentStats().total;

  // Find active menu key
  const activeKey = menuItems.find((item) => pathname.startsWith(item.key))?.key || '/dashboard';

  return (
    <Layout style={{ minHeight: '100vh' }}>
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
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Avatar
            size={36}
            icon={<RobotOutlined />}
            style={{ backgroundColor: token.colorPrimary, flexShrink: 0 }}
          />
          {!collapsed && (
            <Title
              level={5}
              style={{
                color: '#fff',
                margin: '0 0 0 12px',
                whiteSpace: 'nowrap',
                fontSize: 15,
              }}
            >
              AI Game Studio
            </Title>
          )}
        </div>

        {/* Navigation */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        {/* Header */}
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Tooltip title={collapsed ? '展开菜单' : '折叠菜单'}>
              {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                onClick: () => setCollapsed(!collapsed),
                style: { fontSize: 18, cursor: 'pointer' },
              })}
            </Tooltip>
            <Title level={4} style={{ margin: 0 }}>
              {menuItems.find((i) => i.key === activeKey)?.label || 'AI Game Studio'}
            </Title>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tooltip title={`${agentCount} AI 代理就绪`}>
              <Avatar size="small" style={{ backgroundColor: '#52c41a' }}>
                {agentCount}
              </Avatar>
            </Tooltip>
          </div>
        </Header>

        {/* Main Content */}
        <Content
          style={{
            margin: 24,
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
