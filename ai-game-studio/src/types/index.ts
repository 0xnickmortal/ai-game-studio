// ============================================
// AI Game Studio - Core Type Definitions
// ============================================

/** Agent tier in the hierarchy */
export type AgentTier = 1 | 2 | 3;

/** Claude model options */
export type ClaudeModel = 'opus' | 'sonnet' | 'haiku';

/** Game engine type */
export type GameEngine = 'godot' | 'unity' | 'unreal';

/** Agent definition parsed from .md files */
export interface AgentDef {
  id: string;
  name: string;
  tier: AgentTier;
  domain: string;
  description: string;
  model: ClaudeModel;
  tools: string[];
  disallowedTools: string[];
  skills: string[];
  delegatesTo: string[];
  escalatesTo: string | null;
  systemPrompt: string;
  color?: string;
  /** Engine-specific agents belong to a single engine; null = universal agent */
  engine?: GameEngine | null;
}

/** Chat message */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId: string;
  timestamp: number;
}

/** Conversation thread */
export interface Conversation {
  id: string;
  projectId: string;
  agentId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

/** Project */
export interface Project {
  id: string;
  name: string;
  description: string;
  engine: 'godot' | 'unity' | 'unreal' | 'html5' | 'none';
  status: 'concept' | 'pre-production' | 'production' | 'alpha' | 'beta' | 'release';
  pillars: string[];
  createdAt: number;
  updatedAt: number;
}

/** Sprint */
export interface Sprint {
  id: string;
  projectId: string;
  number: number;
  goal: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
}

/** Task priority */
export type TaskPriority = 'must_have' | 'should_have' | 'nice_to_have';

/** Task status for kanban */
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

/** Task */
export interface Task {
  id: string;
  sprintId: string | null;
  projectId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedAgent: string | null;
  estimateDays: number;
  labels: string[];
  sortOrder: number;
}

/** Game generation step */
export type GenStep = 'concept' | 'design' | 'art' | 'levels' | 'code' | 'preview';

/** Game generation session */
export interface GameGeneration {
  id: string;
  projectId: string;
  currentStep: GenStep;
  concept: string;
  designDoc: string;
  artStyle: string;
  levelData: string;
  generatedCode: string;
  previewUrl: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

/** Agent hierarchy node for React Flow */
export interface AgentNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    agent: AgentDef;
    isActive: boolean;
  };
}

/** Agent hierarchy edge for React Flow */
export interface AgentEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
}
