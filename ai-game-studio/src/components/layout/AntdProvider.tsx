'use client';

import React from 'react';
import { ConfigProvider, theme, App } from 'antd';
import zhCN from 'antd/locale/zh_CN';

/**
 * Runway design system applied to Ant Design
 * Reference: npx getdesign@latest add runwayml
 *
 * True black backgrounds, zero shadows,
 * cool-gray text, interface-as-invisible.
 */
export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#5e6ad2',
          colorLink: '#7170ff',
          colorLinkHover: '#828fff',
          colorSuccess: '#27a644',
          colorWarning: '#f59e0b',
          colorError: '#e74c3c',
          colorInfo: '#5e6ad2',
          colorBgBase: '#000000',
          colorBgContainer: '#030303',
          colorBgElevated: '#1a1a1a',
          colorBgLayout: '#000000',
          colorText: '#f7f8f8',
          colorTextSecondary: '#767d88',
          colorTextTertiary: '#7d848e',
          colorTextQuaternary: '#a7a7a7',
          colorBorder: '#27272a',
          colorBorderSecondary: '#27272a',
          borderRadius: 6,
          borderRadiusLG: 8,
          borderRadiusSM: 4,
          borderRadiusXS: 2,
          fontFamily: '"Inter", "Inter Variable", -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif',
          fontFamilyCode: 'ui-monospace, "SF Mono", Menlo, Monaco, monospace',
          fontSize: 14,
          boxShadow: 'none',
          boxShadowSecondary: 'none',
        },
        components: {
          Layout: {
            siderBg: '#000000',
            headerBg: '#000000',
            bodyBg: '#000000',
            triggerBg: '#1a1a1a',
          },
          Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(255,255,255,0.06)',
            darkItemHoverBg: 'rgba(255,255,255,0.04)',
            darkItemColor: '#767d88',
            darkItemSelectedColor: '#ffffff',
            itemBorderRadius: 4,
          },
          Card: {
            colorBgContainer: '#030303',
            colorBorderSecondary: '#27272a',
            headerBg: 'transparent',
            paddingLG: 16,
          },
          Button: {
            defaultBg: 'transparent',
            defaultBorderColor: '#27272a',
            defaultColor: '#f7f8f8',
            primaryShadow: 'none',
            dangerShadow: 'none',
            fontWeight: 600,
          },
          Input: {
            colorBgContainer: 'transparent',
            colorBorder: '#27272a',
            activeBorderColor: '#5e6ad2',
            activeShadow: 'none',
          },
          Modal: {
            contentBg: '#1a1a1a',
            headerBg: '#1a1a1a',
            titleColor: '#f7f8f8',
          },
          Typography: {
            colorTextHeading: '#f7f8f8',
          },
          Tooltip: {
            colorBgSpotlight: '#1a1a1a',
            colorTextLightSolid: '#f7f8f8',
          },
          Segmented: {
            itemSelectedBg: 'rgba(255,255,255,0.06)',
            itemHoverBg: 'rgba(255,255,255,0.04)',
            trackBg: 'transparent',
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
