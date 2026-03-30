// ============================================
// Skills Registry - All 37 skills from Claude Code Game Studios
// Each skill maps to a .claude/skills/[name]/SKILL.md workflow
// ============================================

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  /** Required user input description */
  inputHint: string;
  /** Whether user input is required before execution */
  requiresInput: boolean;
  /** Primary agents involved */
  agents: string[];
  /** Icon identifier for display */
  icon: string;
}

export type SkillCategory =
  | 'onboarding'
  | 'design'
  | 'implementation'
  | 'production'
  | 'quality'
  | 'release'
  | 'team';

export const SKILL_CATEGORIES: Record<SkillCategory, { label: string; color: string }> = {
  onboarding: { label: '引导', color: '#6366f1' },
  design: { label: '设计', color: '#8b5cf6' },
  implementation: { label: '实现', color: '#3b82f6' },
  production: { label: '生产', color: '#f59e0b' },
  quality: { label: '质量', color: '#10b981' },
  release: { label: '发布', color: '#ef4444' },
  team: { label: '团队协作', color: '#ec4899' },
};

export const SKILLS: SkillDef[] = [
  // ── Onboarding ─────────────────────────────
  {
    id: 'start',
    name: '首次引导',
    description: '新项目引导流程 — 检测项目状态，推荐下一步操作',
    category: 'onboarding',
    inputHint: '',
    requiresInput: false,
    agents: ['producer', 'creative-director'],
    icon: 'rocket',
  },
  {
    id: 'setup-engine',
    name: '配置引擎',
    description: '配置游戏引擎和版本，固定引擎引用文档',
    category: 'onboarding',
    inputHint: '选择引擎: godot / unity / unreal',
    requiresInput: true,
    agents: ['technical-director'],
    icon: 'setting',
  },
  {
    id: 'onboard',
    name: '成员入职',
    description: '为新成员或代理生成上下文感知的入职文档',
    category: 'onboarding',
    inputHint: '角色或领域名称，如 "gameplay-programmer"',
    requiresInput: true,
    agents: ['producer'],
    icon: 'user-add',
  },
  {
    id: 'project-stage-detect',
    name: '项目阶段检测',
    description: '分析项目状态，检测开发阶段，识别差距和下一步',
    category: 'onboarding',
    inputHint: '',
    requiresInput: false,
    agents: ['producer'],
    icon: 'search',
  },

  // ── Design ──────────────────────────────────
  {
    id: 'brainstorm',
    name: '头脑风暴',
    description: '引导式创意构思 — 从零到结构化游戏概念',
    category: 'design',
    inputHint: '游戏类型或初始想法',
    requiresInput: false,
    agents: ['creative-director', 'game-designer'],
    icon: 'bulb',
  },
  {
    id: 'design-system',
    name: '系统设计',
    description: '分段式 GDD 编写 — 收集上下文，逐节协作，增量写入',
    category: 'design',
    inputHint: '系统名称，如 "战斗系统" 或 "背包系统"',
    requiresInput: true,
    agents: ['game-designer', 'systems-designer'],
    icon: 'file-text',
  },
  {
    id: 'map-systems',
    name: '系统拆解',
    description: '将游戏概念分解为独立系统，映射依赖关系，确定优先级',
    category: 'design',
    inputHint: '游戏概念描述',
    requiresInput: true,
    agents: ['game-designer', 'systems-designer'],
    icon: 'apartment',
  },
  {
    id: 'design-review',
    name: '设计评审',
    description: '检查设计文档的完整性、一致性和可实现性',
    category: 'design',
    inputHint: '设计文档路径',
    requiresInput: true,
    agents: ['game-designer', 'lead-programmer'],
    icon: 'file-search',
  },

  // ── Implementation ──────────────────────────
  {
    id: 'architecture-decision',
    name: '架构决策',
    description: '创建架构决策记录 (ADR)，记录技术决策及其影响',
    category: 'implementation',
    inputHint: '决策主题，如 "状态管理方案选择"',
    requiresInput: true,
    agents: ['technical-director', 'lead-programmer'],
    icon: 'cluster',
  },
  {
    id: 'code-review',
    name: '代码审查',
    description: '架构和质量代码审查，检查编码标准和性能问题',
    category: 'implementation',
    inputHint: '文件路径或代码片段',
    requiresInput: true,
    agents: ['lead-programmer'],
    icon: 'code',
  },
  {
    id: 'prototype',
    name: '快速原型',
    description: '快速构建一次性原型来验证游戏概念和机制',
    category: 'implementation',
    inputHint: '要验证的机制描述',
    requiresInput: true,
    agents: ['prototyper'],
    icon: 'experiment',
  },
  {
    id: 'reverse-document',
    name: '逆向文档',
    description: '从现有代码反向生成设计或架构文档',
    category: 'implementation',
    inputHint: '代码目录或文件路径',
    requiresInput: true,
    agents: ['lead-programmer', 'game-designer'],
    icon: 'swap',
  },
  {
    id: 'tech-debt',
    name: '技术债务',
    description: '扫描、分类和优先排序技术债务',
    category: 'implementation',
    inputHint: '',
    requiresInput: false,
    agents: ['lead-programmer'],
    icon: 'warning',
  },
  {
    id: 'localize',
    name: '本地化',
    description: '提取字符串、验证本地化就绪度、生成翻译表',
    category: 'implementation',
    inputHint: '',
    requiresInput: false,
    agents: ['localization-lead'],
    icon: 'global',
  },
  {
    id: 'hotfix',
    name: '紧急修复',
    description: '绕过正常流程的紧急修复工作流，含完整审计',
    category: 'implementation',
    inputHint: '问题描述和严重等级',
    requiresInput: true,
    agents: ['lead-programmer', 'qa-lead'],
    icon: 'fire',
  },

  // ── Production ──────────────────────────────
  {
    id: 'sprint-plan',
    name: '冲刺规划',
    description: '生成或更新冲刺计划，基于里程碑和已完成工作',
    category: 'production',
    inputHint: '冲刺目标或里程碑信息',
    requiresInput: false,
    agents: ['producer', 'game-designer'],
    icon: 'calendar',
  },
  {
    id: 'estimate',
    name: '工作量评估',
    description: '分析任务复杂度、依赖和风险，生成结构化评估',
    category: 'production',
    inputHint: '任务描述',
    requiresInput: true,
    agents: ['producer', 'lead-programmer'],
    icon: 'hourglass',
  },
  {
    id: 'scope-check',
    name: '范围检查',
    description: '对比原始计划分析当前范围，标记范围蔓延',
    category: 'production',
    inputHint: '功能或冲刺名称',
    requiresInput: true,
    agents: ['producer'],
    icon: 'aim',
  },
  {
    id: 'milestone-review',
    name: '里程碑评审',
    description: '生成里程碑进度报告，含功能完成度和风险评估',
    category: 'production',
    inputHint: '',
    requiresInput: false,
    agents: ['producer', 'qa-lead'],
    icon: 'flag',
  },
  {
    id: 'retrospective',
    name: '回顾会议',
    description: '分析已完成工作、速度和阻碍，生成可执行洞察',
    category: 'production',
    inputHint: '',
    requiresInput: false,
    agents: ['producer'],
    icon: 'history',
  },
  {
    id: 'changelog',
    name: '变更日志',
    description: '从 git 提交和冲刺数据自动生成变更日志',
    category: 'production',
    inputHint: '版本号或日期范围',
    requiresInput: false,
    agents: ['community-manager'],
    icon: 'unordered-list',
  },

  // ── Quality ─────────────────────────────────
  {
    id: 'bug-report',
    name: '缺陷报告',
    description: '生成结构化缺陷报告，含复现步骤和严重等级',
    category: 'quality',
    inputHint: '问题描述',
    requiresInput: true,
    agents: ['qa-tester'],
    icon: 'bug',
  },
  {
    id: 'balance-check',
    name: '平衡检查',
    description: '分析平衡数据和公式，识别异常值和失衡',
    category: 'quality',
    inputHint: '数据文件路径或系统名称',
    requiresInput: true,
    agents: ['systems-designer', 'economy-designer'],
    icon: 'sliders',
  },
  {
    id: 'asset-audit',
    name: '资源审计',
    description: '审查游戏资源的命名规范、文件大小、格式标准',
    category: 'quality',
    inputHint: '',
    requiresInput: false,
    agents: ['art-director', 'technical-artist'],
    icon: 'folder-open',
  },
  {
    id: 'perf-profile',
    name: '性能分析',
    description: '结构化性能分析工作流，识别瓶颈并排序优化建议',
    category: 'quality',
    inputHint: '关注的区域或场景',
    requiresInput: false,
    agents: ['performance-analyst'],
    icon: 'dashboard',
  },
  {
    id: 'playtest-report',
    name: '测试报告',
    description: '生成结构化测试报告模板或分析现有测试笔记',
    category: 'quality',
    inputHint: '',
    requiresInput: false,
    agents: ['qa-lead', 'game-designer'],
    icon: 'form',
  },
  {
    id: 'gate-check',
    name: '阶段门检查',
    description: '验证是否准备好进入下一开发阶段',
    category: 'quality',
    inputHint: '目标阶段: pre-production / production / alpha / beta / release',
    requiresInput: true,
    agents: ['producer', 'qa-lead'],
    icon: 'safety-certificate',
  },

  // ── Release ─────────────────────────────────
  {
    id: 'release-checklist',
    name: '发布清单',
    description: '生成全面的发布前验证清单',
    category: 'release',
    inputHint: '',
    requiresInput: false,
    agents: ['release-manager', 'qa-lead'],
    icon: 'check-square',
  },
  {
    id: 'launch-checklist',
    name: '上线清单',
    description: '完整上线就绪验证 — 代码、内容、商店、营销、社区、法务',
    category: 'release',
    inputHint: '',
    requiresInput: false,
    agents: ['release-manager', 'producer', 'community-manager'],
    icon: 'crown',
  },
  {
    id: 'patch-notes',
    name: '补丁说明',
    description: '从 git 历史和内部变更日志生成玩家友好的补丁说明',
    category: 'release',
    inputHint: '版本号',
    requiresInput: false,
    agents: ['community-manager'],
    icon: 'notification',
  },

  // ── Team Orchestration ──────────────────────
  {
    id: 'team-combat',
    name: '战斗团队',
    description: '协调战斗团队：设计→实现→AI→美术→音效→测试',
    category: 'team',
    inputHint: '战斗功能描述',
    requiresInput: true,
    agents: ['game-designer', 'gameplay-programmer', 'ai-programmer', 'technical-artist', 'sound-designer', 'qa-tester'],
    icon: 'thunderbolt',
  },
  {
    id: 'team-level',
    name: '关卡团队',
    description: '协调关卡设计团队：关卡→叙事→世界→美术→系统→QA',
    category: 'team',
    inputHint: '关卡或区域描述',
    requiresInput: true,
    agents: ['level-designer', 'narrative-director', 'world-builder', 'art-director', 'systems-designer', 'qa-tester'],
    icon: 'layout',
  },
  {
    id: 'team-narrative',
    name: '叙事团队',
    description: '协调叙事团队：叙事→文案→世界观→关卡',
    category: 'team',
    inputHint: '故事或角色描述',
    requiresInput: true,
    agents: ['narrative-director', 'writer', 'world-builder', 'level-designer'],
    icon: 'book',
  },
  {
    id: 'team-audio',
    name: '音频团队',
    description: '协调音频团队：音频总监→音效→技术美术→游戏程序',
    category: 'team',
    inputHint: '音频功能描述',
    requiresInput: true,
    agents: ['audio-director', 'sound-designer', 'technical-artist', 'gameplay-programmer'],
    icon: 'sound',
  },
  {
    id: 'team-ui',
    name: 'UI 团队',
    description: '协调 UI 团队：UX→UI 程序→美术总监',
    category: 'team',
    inputHint: 'UI 功能描述',
    requiresInput: true,
    agents: ['ux-designer', 'ui-programmer', 'art-director'],
    icon: 'appstore',
  },
  {
    id: 'team-polish',
    name: '打磨团队',
    description: '协调打磨团队：性能→技术美术→音效→QA',
    category: 'team',
    inputHint: '需要打磨的功能或区域',
    requiresInput: true,
    agents: ['performance-analyst', 'technical-artist', 'sound-designer', 'qa-tester'],
    icon: 'star',
  },
  {
    id: 'team-release',
    name: '发布团队',
    description: '协调发布团队：发布经理→QA→DevOps→制作人',
    category: 'team',
    inputHint: '发布版本信息',
    requiresInput: true,
    agents: ['release-manager', 'qa-lead', 'devops-engineer', 'producer'],
    icon: 'rocket',
  },
];

/** Get skills by category */
export function getSkillsByCategory(category: SkillCategory): SkillDef[] {
  return SKILLS.filter(s => s.category === category);
}

/** Get skill by ID */
export function getSkillById(id: string): SkillDef | undefined {
  return SKILLS.find(s => s.id === id);
}
