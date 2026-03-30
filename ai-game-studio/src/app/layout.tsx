import type { Metadata } from 'next';
import './globals.css';
import AntdProvider from '@/components/layout/AntdProvider';
import AppLayout from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'AI Game Studio',
  description: 'AI 驱动的游戏开发工作室 - 48个AI代理协作制作游戏',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdProvider>
          <AppLayout>{children}</AppLayout>
        </AntdProvider>
      </body>
    </html>
  );
}
