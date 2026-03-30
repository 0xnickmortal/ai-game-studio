// ============================================
// Centralized path management
// All project paths derived from runtime, no hardcoding
// ============================================

import path from 'path';

/** ai-game-studio directory (process.cwd() when running next dev/build) */
export const APP_ROOT = process.cwd();

/** Parent project root (ClaudeGameTeam) */
export const PROJECT_ROOT = path.resolve(APP_ROOT, '..');

/** Engine config JSON stored in app root */
export const CONFIG_PATH = path.join(APP_ROOT, 'engine-config.json');

/** Claude docs directory */
export const CLAUDE_DOCS_DIR = path.join(PROJECT_ROOT, '.claude', 'docs');

/** Technical preferences markdown */
export const TECH_PREFS_PATH = path.join(CLAUDE_DOCS_DIR, 'technical-preferences.md');

/** Agent definition files directory */
export const AGENTS_DIR = path.join(PROJECT_ROOT, '.claude', 'agents');
