// ============================================
// Zustand Global State Store
// ============================================

import { create } from 'zustand';
import { Project, Conversation, ChatMessage, Task, Sprint, GameGeneration, GameEngine } from '@/types';

// ── Generate page types ──

export interface GenStepMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  thinking?: string;
}

export interface GenStepState {
  messages: GenStepMessage[];
  confirmed: boolean;
  startTime?: number;
  endTime?: number;
}

interface GenerateSessionState {
  currentStep: number;
  stepStates: GenStepState[];
  generatedCode: string;
  codeMode: 'engine' | 'html5';
}

interface AppState {
  // ── Current selections ──
  currentProjectId: string | null;
  currentAgentId: string | null;
  currentConversationId: string | null;

  // ── Data ──
  projects: Project[];
  conversations: Conversation[];
  tasks: Task[];
  sprints: Sprint[];
  generations: GameGeneration[];

  // ── Generate session (persisted across navigation) ──
  generateSession: GenerateSessionState;

  // ── UI state ──
  sidebarCollapsed: boolean;
  chatDrawerOpen: boolean;
  isGenerating: boolean;

  // ── Actions ──
  setCurrentProject: (id: string | null) => void;
  setCurrentAgent: (id: string | null) => void;
  setCurrentConversation: (id: string | null) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setChatDrawerOpen: (v: boolean) => void;

  addProject: (project: Project) => void;
  addConversation: (conv: Conversation) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;

  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  moveTask: (id: string, status: Task['status']) => void;

  setIsGenerating: (v: boolean) => void;
  addGeneration: (gen: GameGeneration) => void;
  updateGeneration: (id: string, updates: Partial<GameGeneration>) => void;

  // ── Generate session actions ──
  setGenerateSession: (update: Partial<GenerateSessionState>) => void;
  setGenStepStates: (stepStates: GenStepState[]) => void;
  updateGenStep: (index: number, update: Partial<GenStepState>) => void;
  addGenStepMessage: (index: number, msg: GenStepMessage) => void;
  resetGenerateSession: (stepCount: number) => void;
}

const EMPTY_GEN_SESSION: GenerateSessionState = {
  currentStep: 0,
  stepStates: [],
  generatedCode: '',
  codeMode: 'engine',
};

export const useAppStore = create<AppState>()((set) => ({
  // Defaults
  currentProjectId: null,
  currentAgentId: null,
  currentConversationId: null,
  projects: [],
  conversations: [],
  tasks: [],
  sprints: [],
  generations: [],
  generateSession: { ...EMPTY_GEN_SESSION },
  sidebarCollapsed: false,
  chatDrawerOpen: false,
  isGenerating: false,

  // Selections
  setCurrentProject: (id) => set({ currentProjectId: id }),
  setCurrentAgent: (id) => set({ currentAgentId: id }),
  setCurrentConversation: (id) => set({ currentConversationId: id }),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setChatDrawerOpen: (v) => set({ chatDrawerOpen: v }),

  // Projects
  addProject: (project) =>
    set((s) => ({ projects: [...s.projects, project] })),

  // Conversations
  addConversation: (conv) =>
    set((s) => ({ conversations: [...s.conversations, conv] })),

  addMessage: (conversationId, message) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, message], updatedAt: Date.now() }
          : c
      ),
    })),

  // Tasks (Kanban)
  addTask: (task) =>
    set((s) => ({ tasks: [...s.tasks, task] })),

  updateTask: (id, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  moveTask: (id, status) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    })),

  // Generation
  setIsGenerating: (v) => set({ isGenerating: v }),

  addGeneration: (gen) =>
    set((s) => ({ generations: [...s.generations, gen] })),

  updateGeneration: (id, updates) =>
    set((s) => ({
      generations: s.generations.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    })),

  // Generate session
  setGenerateSession: (update) =>
    set((s) => ({ generateSession: { ...s.generateSession, ...update } })),

  setGenStepStates: (stepStates) =>
    set((s) => ({ generateSession: { ...s.generateSession, stepStates } })),

  updateGenStep: (index, update) =>
    set((s) => ({
      generateSession: {
        ...s.generateSession,
        stepStates: s.generateSession.stepStates.map((st, i) =>
          i === index ? { ...st, ...update } : st
        ),
      },
    })),

  addGenStepMessage: (index, msg) =>
    set((s) => ({
      generateSession: {
        ...s.generateSession,
        stepStates: s.generateSession.stepStates.map((st, i) =>
          i === index ? { ...st, messages: [...st.messages, msg] } : st
        ),
      },
    })),

  resetGenerateSession: (stepCount) =>
    set({
      generateSession: {
        ...EMPTY_GEN_SESSION,
        stepStates: Array.from({ length: stepCount }, () => ({ messages: [], confirmed: false })),
      },
    }),
}));
