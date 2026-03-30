'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Tag, Empty } from 'antd';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

export default function KanbanColumn({ id, title, color, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: '1 1 0',
        minWidth: 240,
        background: isOver ? '#1e293b' : '#111827',
        borderRadius: 8,
        border: isOver ? `2px dashed ${color}` : '2px solid transparent',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Column header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
          }}
        />
        <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{title}</span>
        <Tag style={{ marginLeft: 'auto' }}>{count}</Tag>
      </div>

      {/* Cards */}
      <div
        style={{
          padding: 8,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 100,
        }}
      >
        {count === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: '#64748b' }}>拖放任务到此处</span>}
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
