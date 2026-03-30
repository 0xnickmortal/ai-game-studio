'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Modal, Form, Input, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { AGENTS } from '@/data/agents';
import KanbanBoard from '@/components/kanban/KanbanBoard';

const { Title } = Typography;

let taskIdCounter = 10;

export default function SprintsPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'demo-1', sprintId: null, projectId: '1', title: '定义核心游戏循环',
      description: '设计并文档化游戏的核心循环机制', priority: 'must_have',
      status: 'todo', assignedAgent: 'game-designer', estimateDays: 2, labels: ['设计'], sortOrder: 0,
    },
    {
      id: 'demo-2', sprintId: null, projectId: '1', title: '搭建项目脚手架',
      description: '初始化游戏引擎项目结构', priority: 'must_have',
      status: 'in_progress', assignedAgent: 'lead-programmer', estimateDays: 1, labels: ['工程'], sortOrder: 0,
    },
    {
      id: 'demo-3', sprintId: null, projectId: '1', title: '美术风格探索',
      description: '确定游戏的视觉方向和风格', priority: 'should_have',
      status: 'backlog', assignedAgent: 'art-director', estimateDays: 3, labels: ['美术'], sortOrder: 0,
    },
    {
      id: 'demo-4', sprintId: null, projectId: '1', title: '编写 GDD 概述',
      description: '游戏设计文档第一部分', priority: 'must_have',
      status: 'review', assignedAgent: 'game-designer', estimateDays: 1, labels: ['设计'], sortOrder: 0,
    },
    {
      id: 'demo-5', sprintId: null, projectId: '1', title: '配置 CI/CD',
      description: '设置自动构建和测试流水线', priority: 'nice_to_have',
      status: 'done', assignedAgent: 'devops-engineer', estimateDays: 1, labels: ['工程'], sortOrder: 0,
    },
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleTaskMove = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const addTask = (values: { title: string; description: string; priority: TaskPriority; assignedAgent: string }) => {
    const newTask: Task = {
      id: `task-${++taskIdCounter}`,
      sprintId: null,
      projectId: '1',
      title: values.title,
      description: values.description || '',
      priority: values.priority,
      status: 'backlog',
      assignedAgent: values.assignedAgent || null,
      estimateDays: 1,
      labels: [],
      sortOrder: tasks.length,
    };
    setTasks((prev) => [...prev, newTask]);
    setModalOpen(false);
    form.resetFields();
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>冲刺看板</Title>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              添加任务
            </Button>
          </Col>
        </Row>
      </Card>

      <KanbanBoard
        tasks={tasks}
        onTaskMove={handleTaskMove}
        onTaskDelete={handleTaskDelete}
      />

      <Modal title="添加任务" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={addTask}>
          <Form.Item name="title" label="任务标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="例如：实现玩家移动系统" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="任务描述..." />
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="should_have">
            <Select
              options={[
                { label: '必须 (Must Have)', value: 'must_have' },
                { label: '应该 (Should Have)', value: 'should_have' },
                { label: '可选 (Nice to Have)', value: 'nice_to_have' },
              ]}
            />
          </Form.Item>
          <Form.Item name="assignedAgent" label="分配代理">
            <Select
              allowClear
              showSearch
              placeholder="选择一个 AI 代理"
              optionFilterProp="label"
              options={AGENTS.map((a) => ({ label: `${a.name} (${a.id})`, value: a.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
