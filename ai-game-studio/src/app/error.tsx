'use client';

import { Button, Result } from 'antd';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Result
      status="error"
      title="页面出错了"
      subTitle={error.message || '发生了未知错误，请重试。'}
      extra={[
        <Button key="retry" type="primary" onClick={reset}>
          重试
        </Button>,
        <Button key="home" onClick={() => window.location.href = '/dashboard'}>
          返回首页
        </Button>,
      ]}
    />
  );
}
