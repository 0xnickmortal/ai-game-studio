// ============================================
// Agent Definition Parser
// Reads .claude/agents/*.md files and extracts
// YAML frontmatter + markdown body (system prompt)
// ============================================

import fs from 'fs';
import path from 'path';
import { AGENTS_DIR } from '@/lib/paths';

export interface ParsedAgentDef {
  /** Agent ID (filename without .md) */
  id: string;
  /** Display name from frontmatter */
  name: string;
  /** Description from frontmatter */
  description: string;
  /** Claude model */
  model: string;
  /** Allowed tools */
  tools: string[];
  /** Disallowed tools */
  disallowedTools: string[];
  /** Max conversation turns */
  maxTurns: number;
  /** Full markdown body (the real system prompt) */
  systemPrompt: string;
}

/**
 * Parse YAML-like frontmatter from a markdown file.
 * Handles the simple key: value format used by Claude agent definitions.
 */
function parseFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  const meta: Record<string, string> = {};
  let body = content;

  if (content.startsWith('---')) {
    const endIdx = content.indexOf('---', 3);
    if (endIdx !== -1) {
      const frontmatter = content.slice(3, endIdx).trim();
      body = content.slice(endIdx + 3).trim();

      for (const line of frontmatter.split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const key = line.slice(0, colonIdx).trim();
        let value = line.slice(colonIdx + 1).trim();
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        meta[key] = value;
      }
    }
  }

  return { meta, body };
}

/**
 * Parse a single agent .md file into a structured definition.
 */
export function parseAgentFile(filePath: string): ParsedAgentDef | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { meta, body } = parseFrontmatter(content);
    const id = path.basename(filePath, '.md');

    return {
      id,
      name: meta.name || id,
      description: meta.description || '',
      model: meta.model || 'sonnet',
      tools: meta.tools ? meta.tools.split(',').map(t => t.trim()) : [],
      disallowedTools: meta.disallowedTools ? meta.disallowedTools.split(',').map(t => t.trim()) : [],
      maxTurns: parseInt(meta.maxTurns || '10', 10),
      systemPrompt: body,
    };
  } catch (err) {
    console.error(`Failed to parse agent file: ${filePath}`, err);
    return null;
  }
}

/**
 * Parse all agent .md files from the agents directory.
 * Returns a Map keyed by agent ID.
 */
export function parseAllAgents(agentsDir: string): Map<string, ParsedAgentDef> {
  const result = new Map<string, ParsedAgentDef>();

  try {
    const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const parsed = parseAgentFile(path.join(agentsDir, file));
      if (parsed) {
        result.set(parsed.id, parsed);
      }
    }
  } catch (err) {
    console.error(`Failed to read agents directory: ${agentsDir}`, err);
  }

  return result;
}

/**
 * Get the real system prompt for an agent by reading its .md file.
 * Falls back to placeholder if file not found.
 */
export function getRealSystemPrompt(agentId: string): string | null {
  const filePath = path.join(AGENTS_DIR, `${agentId}.md`);
  try {
    if (fs.existsSync(filePath)) {
      const parsed = parseAgentFile(filePath);
      return parsed?.systemPrompt || null;
    }
  } catch {
    // Agent file not found or unreadable
  }

  return null;
}
