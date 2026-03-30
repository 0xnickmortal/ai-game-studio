'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/types';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';

const COLUMNS: { key: TaskStatus; title: string; color: string }[] = [
  { key: 'backlog', title: '待办', color: '#64748b' },
  { key: 'todo', title: '待开始', color: '#f59e0b' },
  { key: 'in_progress', title: '进行中', color: '#3b82f6' },
  { key: 'review', title: '审查中', color: '#8b5cf6' },
  { key: 'done', title: '已完成', color: '#10b981' },
];

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: TaskStatus) => void;
  onTaskDelete: (taskId: string) => void;
}

export default function KanbanBoard({ tasks, onTaskMove, onTaskDelete }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetColumn = COLUMNS.find((c) => c.key === overId);
    if (targetColumn) {
      onTaskMove(taskId, targetColumn.key);
      return;
    }

    // Check if dropped on another task - move to that task's column
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && overTask.id !== taskId) {
      onTaskMove(taskId, overTask.status);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', minHeight: 500 }}>
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.key);
          return (
            <KanbanColumn
              key={col.key}
              id={col.key}
              title={col.title}
              color={col.color}
              count={columnTasks.length}
            >
              <SortableContext
                items={columnTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {columnTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    onDelete={() => onTaskDelete(task.id)}
                  />
                ))}
              </SortableContext>
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <KanbanCard task={activeTask} isDragging onDelete={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
