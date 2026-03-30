// ============================================
// Engine Configuration Logic
// Manages project engine/language/rendering settings
// ============================================

import { GameEngine } from '@/types';

/** Engine configuration schema */
export interface EngineConfig {
  engine: GameEngine | null;
  /** Engine version string, e.g. "4.5" */
  engineVersion?: string;
  language: string;
  rendering: string;
  physics: string;
  /** Path to Godot executable for headless web export */
  godotBinaryPath?: string;
  namingConventions: {
    classes: string;
    variables: string;
    signals: string;
    files: string;
    scenes: string;
    constants: string;
  };
  performanceBudgets: {
    targetFps: number;
    frameBudgetMs: number;
    maxDrawCalls: number;
    memoryCeilingMb: number;
  };
}

/** Default unconfigured state */
export const DEFAULT_CONFIG: EngineConfig = {
  engine: null,
  language: '',
  rendering: '',
  physics: '',
  namingConventions: {
    classes: '',
    variables: '',
    signals: '',
    files: '',
    scenes: '',
    constants: '',
  },
  performanceBudgets: {
    targetFps: 60,
    frameBudgetMs: 16.67,
    maxDrawCalls: 2000,
    memoryCeilingMb: 2048,
  },
};

/** Engine-specific options */
export const ENGINE_OPTIONS: Record<GameEngine, {
  label: string;
  description: string;
  icon: string;
  languages: string[];
  renderers: string[];
  physics: string[];
  defaultNaming: EngineConfig['namingConventions'];
}> = {
  godot: {
    label: 'Godot',
    description: '开源轻量引擎，适合独立开发和2D/3D游戏',
    icon: '🎮',
    languages: ['GDScript', 'C# (.NET)', 'C++ (GDExtension)'],
    renderers: ['Forward+', 'Mobile (Forward)', 'Compatibility (GL)'],
    physics: ['Jolt Physics (默认)', 'Godot Physics'],
    defaultNaming: {
      classes: 'PascalCase',
      variables: 'snake_case',
      signals: 'snake_case (past tense: health_changed)',
      files: 'snake_case.gd',
      scenes: 'snake_case.tscn',
      constants: 'SCREAMING_SNAKE_CASE',
    },
  },
  unity: {
    label: 'Unity',
    description: '跨平台商业引擎，成熟的生态系统和资产商店',
    icon: '⚡',
    languages: ['C#', 'C# + DOTS/ECS'],
    renderers: ['URP (Universal)', 'HDRP (High Definition)', 'Built-in'],
    physics: ['PhysX', 'Unity Physics (DOTS)', 'Havok (DOTS)'],
    defaultNaming: {
      classes: 'PascalCase',
      variables: 'camelCase',
      signals: 'PascalCase (OnHealthChanged)',
      files: 'PascalCase.cs',
      scenes: 'PascalCase.unity',
      constants: 'SCREAMING_SNAKE_CASE',
    },
  },
  unreal: {
    label: 'Unreal Engine 5',
    description: '3A级引擎，Nanite/Lumen，适合高画质项目',
    icon: '🔥',
    languages: ['C++', 'Blueprint', 'C++ + Blueprint 混合'],
    renderers: ['Lumen (动态全局光照)', 'Nanite (虚拟化几何体)', 'Forward Shading'],
    physics: ['Chaos Physics', 'Chaos Vehicle', 'Chaos Destruction'],
    defaultNaming: {
      classes: 'PascalCase (A/U/F/E/T/S prefix)',
      variables: 'PascalCase (bBoolPrefix)',
      signals: 'PascalCase (OnHealthChanged)',
      files: 'PascalCase.h / .cpp',
      scenes: 'PascalCase.umap',
      constants: 'SCREAMING_SNAKE_CASE',
    },
  },
};

/** Generate technical-preferences.md content from config */
export function generateTechPrefsMarkdown(config: EngineConfig): string {
  const engineOpt = config.engine ? ENGINE_OPTIONS[config.engine] : null;
  const nc = config.namingConventions;
  const pb = config.performanceBudgets;

  return `# Technical Preferences

## Engine & Language

- **Engine**: ${engineOpt ? `${engineOpt.label}${config.engineVersion ? ' ' + config.engineVersion : ''}` : '[TO BE CONFIGURED — run /setup-engine]'}
- **Language**: ${config.language || '[TO BE CONFIGURED]'}
- **Rendering**: ${config.rendering || '[TO BE CONFIGURED]'}
- **Physics**: ${config.physics || '[TO BE CONFIGURED]'}

## Naming Conventions

- **Classes**: ${nc.classes || '[TO BE CONFIGURED]'}
- **Variables**: ${nc.variables || '[TO BE CONFIGURED]'}
- **Signals/Events**: ${nc.signals || '[TO BE CONFIGURED]'}
- **Files**: ${nc.files || '[TO BE CONFIGURED]'}
- **Scenes/Prefabs**: ${nc.scenes || '[TO BE CONFIGURED]'}
- **Constants**: ${nc.constants || '[TO BE CONFIGURED]'}

## Performance Budgets

- **Target Framerate**: ${pb.targetFps} FPS
- **Frame Budget**: ${pb.frameBudgetMs.toFixed(2)} ms
- **Draw Calls**: < ${pb.maxDrawCalls}
- **Memory Ceiling**: ${pb.memoryCeilingMb} MB

## Testing

- **Framework**: [TO BE CONFIGURED]
- **Minimum Coverage**: [TO BE CONFIGURED]
- **Required Tests**: Balance formulas, gameplay systems, networking (if applicable)

## Forbidden Patterns

- [None configured yet — add as architectural decisions are made]

## Allowed Libraries / Addons

- [None configured yet — add as dependencies are approved]

## Architecture Decisions Log

- [No ADRs yet — use /architecture-decision to create one]
`;
}
