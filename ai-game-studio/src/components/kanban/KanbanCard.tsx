'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tag, Typography } from 'antd';
import { DeleteOutlined, HolderOutlined } from '@ant-design/icons';
import { Task, TaskPriority } from '@/types';
import { AGENTS } from '@/data/agents';

const { Text } = Typography;

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  must_have: { label: '必须', color: 'red' },
  should_have: { label: '应该', color: 'orange' },
  nice_to_have: { label: '可选', color: 'blue' },
};

interface KanbanCardProps {
  task: Task;
  isDragging?: boolean;
  onDelete: () => void;
}

export default function KanbanCard({ task, isDragging, onDelete }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.4 : 1,
  };

  const agent = AGENTS.find((a) => a.id === task.assignedAgent);
  const priority = PRIORITY_CONFIG[task.priority];

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: isDragging ? '#312e81' : '#1e293b',
        borderRadius: 8,
        padding: '10px 12px',
        border: isDragging ? '2px solid #6366f1' : '1px solid #334155',
        cursor: 'grab',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
      }}
      {...attributes}
      {...listeners}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <HolderOutlined style={{ color: '#475569', fontSize: 12 }} />
          <Text strong style={{ fontSize: 13, color: '#e2e8f0' }}>
            {task.title}
          </Text>
        </div>
        <DeleteOutlined
          style={{ color: '#64748b', fontSize: 12, cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        />
      </div>

      {task.description && (
        <Text
          type="secondary"
          style={{ fontSize: 12, display: 'block', margin: '4px 0 8px 18px' }}
          ellipsis
        >
          {task.description}
        </Text>
      )}

      <div style={{ display: 'flex', gap: 4, marginLeft: 18, flexWrap: 'wrap' }}>
        <Tag color={priority.color} style={{ fontSize: 11, margin: 0 }}>
          {priority.label}
        </Tag>
        {agent && (
          <Tag
            style={{
              fontSize: 11,
              margin: 0,
              borderColor: agent.color,
              color: agent.color,
              background: 'transparent',
            }}
          >
            {agent.name}
          </Tag>
        )}
      </div>
    </div>
  );
}
