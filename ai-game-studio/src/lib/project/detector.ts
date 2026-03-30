// ============================================
// Project Stage Detector
// Checks filesystem artifacts to determine project stage
// ============================================

import fs from 'fs';
import path from 'path';
import { PROJECT_ROOT } from '@/lib/paths';

export type ProjectStage =
  | 'fresh'          // No configuration at all
  | 'configured'     // Engine configured but no design
  | 'concept'        // Has game concept / brainstorm docs
  | 'pre-production' // Has design docs (GDD sections)
  | 'production'     // Has source code
  | 'alpha'          // Has tests
  | 'beta'           // Has sprint/milestone data
  | 'release';       // Has release checklist

export interface ProjectStatus {
  stage: ProjectStage;
  hasEngineConfig: boolean;
  hasDesignDocs: boolean;
  hasSourceCode: boolean;
  hasTests: boolean;
  hasSprintData: boolean;
  hasReleaseData: boolean;
  hasGameConcept: boolean;
  details: string[];
  nextSteps: string[];
}

function dirHasFiles(dirPath: string, extensions?: string[]): boolean {
  try {
    if (!fs.existsSync(dirPath)) return false;
    const files = fs.readdirSync(dirPath, { recursive: true }) as string[];
    if (!extensions) return files.length > 0;
    return files.some(f => extensions.some(ext => String(f).endsWith(ext)));
  } catch {
    return false;
  }
}

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function fileContains(filePath: string, search: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.includes(search);
  } catch {
    return false;
  }
}

export function detectProjectStatus(): ProjectStatus {
  const details: string[] = [];
  const nextSteps: string[] = [];

  // Check engine configuration
  const techPrefsPath = path.join(PROJECT_ROOT, '.claude', 'docs', 'technical-preferences.md');
  const hasEngineConfig = fileExists(techPrefsPath) &&
    !fileContains(techPrefsPath, '[TO BE CONFIGURED — run /setup-engine]');

  // Check for engine-config.json (from our frontend)
  const frontendConfigPath = path.join(PROJECT_ROOT, 'ai-game-studio', 'engine-config.json');
  const hasFrontendConfig = fileExists(frontendConfigPath);

  const engineConfigured = hasEngineConfig || hasFrontendConfig;

  if (engineConfigured) {
    details.push('引擎已配置');
  } else {
    details.push('引擎未配置');
    nextSteps.push('配置游戏引擎 → /setup');
  }

  // Check design docs
  const designDir = path.join(PROJECT_ROOT, 'design');
  const hasDesignDocs = dirHasFiles(designDir, ['.md']);
  if (hasDesignDocs) {
    details.push('有设计文档');
  } else {
    if (engineConfigured) nextSteps.push('开始头脑风暴 → /skills (brainstorm)');
  }

  // Check game concept (in design/gdd or design/)
  const gddDir = path.join(PROJECT_ROOT, 'design', 'gdd');
  const hasGameConcept = dirHasFiles(gddDir, ['.md']) || hasDesignDocs;
  if (hasGameConcept) {
    details.push('有游戏概念');
  }

  // Check source code
  const srcDir = path.join(PROJECT_ROOT, 'src');
  const hasSourceCode = dirHasFiles(srcDir, ['.gd', '.cs', '.cpp', '.h', '.rs', '.tscn', '.tres']);
  if (hasSourceCode) {
    details.push('有游戏源代码');
  } else {
    if (hasDesignDocs) nextSteps.push('系统拆解 → /skills (map-systems)');
  }

  // Check tests
  const testsDir = path.join(PROJECT_ROOT, 'tests');
  const hasTests = dirHasFiles(testsDir);
  if (hasTests) {
    details.push('有测试用例');
  }

  // Check sprint/production data
  const productionDir = path.join(PROJECT_ROOT, 'production');
  const hasSprintData = dirHasFiles(productionDir, ['.md']);
  if (hasSprintData) {
    details.push('有生产管理数据');
  }

  // Check release data
  const releaseDir = path.join(PROJECT_ROOT, 'production', 'releases');
  const hasReleaseData = dirHasFiles(releaseDir);

  // Determine stage
  let stage: ProjectStage = 'fresh';
  if (hasReleaseData) stage = 'release';
  else if (hasSprintData) stage = 'beta';
  else if (hasTests) stage = 'alpha';
  else if (hasSourceCode) stage = 'production';
  else if (hasDesignDocs) stage = 'pre-production';
  else if (hasGameConcept) stage = 'concept';
  else if (engineConfigured) stage = 'configured';
  else stage = 'fresh';

  // Add stage-appropriate next steps
  if (stage === 'fresh') {
    nextSteps.unshift('运行 /start 开始引导流程');
  }
  if (stage === 'configured' && !hasGameConcept) {
    nextSteps.push('头脑风暴创意 → /skills (brainstorm)');
  }
  if (stage === 'pre-production' && !hasSourceCode) {
    nextSteps.push('设计系统 → /skills (design-system)');
    nextSteps.push('快速原型验证 → /skills (prototype)');
  }
  if (stage === 'production' && !hasTests) {
    nextSteps.push('编写测试用例');
  }
  if (stage === 'production' && !hasSprintData) {
    nextSteps.push('规划冲刺 → /sprints');
  }

  return {
    stage,
    hasEngineConfig: engineConfigured,
    hasDesignDocs,
    hasSourceCode,
    hasTests,
    hasSprintData,
    hasReleaseData,
    hasGameConcept,
    details,
    nextSteps,
  };
}

/** Stage labels and colors for display */
export const STAGE_INFO: Record<ProjectStage, { label: string; color: string; description: string }> = {
  fresh: { label: '全新项目', color: '#94a3b8', description: '尚未开始，一切从零开始' },
  configured: { label: '已配置', color: '#6366f1', description: '引擎已选定，准备开始设计' },
  concept: { label: '概念阶段', color: '#f59e0b', description: '有初始游戏概念，需要细化' },
  'pre-production': { label: '预生产', color: '#3b82f6', description: '设计文档进行中' },
  production: { label: '生产阶段', color: '#10b981', description: '正在开发游戏代码' },
  alpha: { label: 'Alpha', color: '#8b5cf6', description: '核心功能完成，正在测试' },
  beta: { label: 'Beta', color: '#ec4899', description: '内容基本完成，打磨优化中' },
  release: { label: '发布就绪', color: '#ef4444', description: '准备发布' },
};
