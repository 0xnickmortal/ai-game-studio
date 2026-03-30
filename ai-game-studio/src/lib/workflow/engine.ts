// ============================================
// Workflow Engine - Multi-agent orchestration
// Implements the coordination patterns from Claude Code Game Studios
// ============================================

/** Workflow step definition */
export interface WorkflowStep {
  agentId: string;
  action: string;
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
}

/** Workflow definition */
export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  currentStep: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

/** Pre-defined workflow templates matching the 9 patterns */
export const WORKFLOW_TEMPLATES: Record<string, Omit<Workflow, 'id' | 'currentStep' | 'status'>> = {
  new_feature: {
    name: '新功能开发',
    description: '从创意到实现的完整功能开发流程',
    steps: [
      { agentId: 'creative-director', action: '审核创意', prompt: '评估这个功能创意是否符合游戏愿景', status: 'pending' },
      { agentId: 'game-designer', action: '设计机制', prompt: '设计这个功能的详细游戏机制', status: 'pending' },
      { agentId: 'systems-designer', action: '公式设计', prompt: '设计相关数值公式和平衡参数', status: 'pending' },
      { agentId: 'lead-programmer', action: '技术方案', prompt: '制定技术实现方案和架构设计', status: 'pending' },
      { agentId: 'gameplay-programmer', action: '代码实现', prompt: '实现功能代码', status: 'pending' },
      { agentId: 'qa-tester', action: '测试验证', prompt: '编写测试用例并验证功能', status: 'pending' },
    ],
  },
  bug_fix: {
    name: 'Bug 修复',
    description: '从报告到验证的 Bug 修复流程',
    steps: [
      { agentId: 'qa-lead', action: '分析问题', prompt: '分析 Bug 报告，确定严重性和影响范围', status: 'pending' },
      { agentId: 'lead-programmer', action: '定位原因', prompt: '定位 Bug 的根本原因', status: 'pending' },
      { agentId: 'gameplay-programmer', action: '修复代码', prompt: '修复 Bug 并确保不引入回归', status: 'pending' },
      { agentId: 'qa-tester', action: '回归测试', prompt: '验证修复并进行回归测试', status: 'pending' },
    ],
  },
  balance_pass: {
    name: '平衡调整',
    description: '游戏数值平衡调整流程',
    steps: [
      { agentId: 'game-designer', action: '识别问题', prompt: '分析当前平衡问题', status: 'pending' },
      { agentId: 'systems-designer', action: '调整公式', prompt: '调整数值公式和参数', status: 'pending' },
      { agentId: 'economy-designer', action: '经济影响', prompt: '评估对游戏经济的影响', status: 'pending' },
      { agentId: 'qa-tester', action: '验证平衡', prompt: '测试新的平衡数值', status: 'pending' },
    ],
  },
  content_creation: {
    name: '内容创作',
    description: '游戏内容（关卡/任务/剧情）创作流程',
    steps: [
      { agentId: 'narrative-director', action: '故事框架', prompt: '设计内容的叙事框架', status: 'pending' },
      { agentId: 'writer', action: '文案创作', prompt: '编写对话和文案', status: 'pending' },
      { agentId: 'level-designer', action: '关卡布局', prompt: '设计关卡空间布局', status: 'pending' },
      { agentId: 'art-director', action: '美术方向', prompt: '确定视觉方向和资源需求', status: 'pending' },
      { agentId: 'sound-designer', action: '音效规划', prompt: '规划音效和音乐需求', status: 'pending' },
    ],
  },
  game_generation: {
    name: 'AI 游戏生成',
    description: '从创意到可玩原型的完整生成流程',
    steps: [
      { agentId: 'creative-director', action: '创意评估', prompt: '评估和完善游戏创意', status: 'pending' },
      { agentId: 'game-designer', action: '机制设计', prompt: '设计核心玩法机制', status: 'pending' },
      { agentId: 'art-director', action: '风格定义', prompt: '定义视觉风格方向', status: 'pending' },
      { agentId: 'level-designer', action: '关卡设计', prompt: '设计初始关卡布局', status: 'pending' },
      { agentId: 'gameplay-programmer', action: '代码生成', prompt: '生成完整的 HTML5 Canvas 游戏代码', status: 'pending' },
    ],
  },
  sprint_cycle: {
    name: '冲刺周期',
    description: '完整的敏捷冲刺周期：规划→执行→评审→回顾',
    steps: [
      { agentId: 'producer', action: '冲刺规划', prompt: '基于里程碑目标和团队容量制定冲刺计划', status: 'pending' },
      { agentId: 'game-designer', action: '需求细化', prompt: '将冲刺任务细化为可执行的设计规格', status: 'pending' },
      { agentId: 'lead-programmer', action: '技术分解', prompt: '将设计需求分解为技术任务，评估复杂度', status: 'pending' },
      { agentId: 'qa-lead', action: '测试规划', prompt: '为冲刺目标制定测试策略和验收标准', status: 'pending' },
      { agentId: 'producer', action: '冲刺评审', prompt: '评审冲刺完成度，总结交付成果', status: 'pending' },
      { agentId: 'producer', action: '回顾总结', prompt: '分析冲刺过程中的问题和改进点', status: 'pending' },
    ],
  },
  milestone_checkpoint: {
    name: '里程碑检查',
    description: '里程碑进度评估和质量门控检查',
    steps: [
      { agentId: 'producer', action: '进度评估', prompt: '汇总各部门里程碑完成度', status: 'pending' },
      { agentId: 'creative-director', action: '创意评审', prompt: '评估当前作品是否符合创意愿景', status: 'pending' },
      { agentId: 'technical-director', action: '技术评审', prompt: '评估技术栈健康度、性能指标和技术债务', status: 'pending' },
      { agentId: 'qa-lead', action: '质量评估', prompt: '汇报当前缺陷数、测试覆盖率和质量指标', status: 'pending' },
      { agentId: 'producer', action: 'Go/No-Go 决策', prompt: '综合各方评审，给出是否进入下一阶段的建议', status: 'pending' },
    ],
  },
  release_pipeline: {
    name: '发布管线',
    description: '从候选版本到正式发布的完整流程',
    steps: [
      { agentId: 'qa-lead', action: '发布测试', prompt: '执行发布候选版本的全面测试', status: 'pending' },
      { agentId: 'performance-analyst', action: '性能验证', prompt: '验证性能指标是否达到发布标准', status: 'pending' },
      { agentId: 'release-manager', action: '发布准备', prompt: '准备发布清单、版本号和变更日志', status: 'pending' },
      { agentId: 'community-manager', action: '公告撰写', prompt: '撰写玩家公告和补丁说明', status: 'pending' },
      { agentId: 'devops-engineer', action: '部署执行', prompt: '执行构建、打包和部署流程', status: 'pending' },
      { agentId: 'release-manager', action: '发布验证', prompt: '验证发布成功，监控初始反馈', status: 'pending' },
    ],
  },
  rapid_prototype: {
    name: '快速原型',
    description: '快速验证游戏概念，跳过正式流程以追求速度',
    steps: [
      { agentId: 'creative-director', action: '概念提炼', prompt: '快速提炼核心概念，确定要验证的假设', status: 'pending' },
      { agentId: 'game-designer', action: '最小设计', prompt: '设计最小可玩规则，只保留核心机制', status: 'pending' },
      { agentId: 'prototyper', action: '快速实现', prompt: '用最简单的方式实现可玩原型，不需要完善的代码', status: 'pending' },
      { agentId: 'game-designer', action: '原型评估', prompt: '评估原型是否验证了核心假设，记录发现', status: 'pending' },
    ],
  },
};

/** Get all available workflow templates */
export function getWorkflowTemplates() {
  return Object.entries(WORKFLOW_TEMPLATES).map(([key, wf]) => ({
    key,
    ...wf,
    stepCount: wf.steps.length,
    agents: wf.steps.map((s) => s.agentId),
  }));
}
