'use client';

import React from 'react';
import { ConfigProvider, theme, App } from 'antd';
import zhCN from 'antd/locale/zh_CN';

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 8,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif',
        },
        components: {
          Layout: {
            siderBg: '#111827',
            headerBg: '#1f2937',
            bodyBg: '#0f172a',
          },
          Menu: {
            darkItemBg: '#111827',
            darkItemSelectedBg: '#312e81',
          },
          Card: {
            colorBgContainer: '#1e293b',
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
