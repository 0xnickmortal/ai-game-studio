// ============================================
// GET /api/config - Read engine configuration
// POST /api/config - Save engine configuration
// Stores config as JSON in a local file
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { EngineConfig, DEFAULT_CONFIG, generateTechPrefsMarkdown } from '@/lib/config/engine';
import { CONFIG_PATH, TECH_PREFS_PATH } from '@/lib/paths';

function readConfig(): EngineConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Failed to read config:', err);
  }
  return DEFAULT_CONFIG;
}

function writeConfig(config: EngineConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');

  // Also update .claude/docs/technical-preferences.md
  try {
    const markdown = generateTechPrefsMarkdown(config);
    fs.writeFileSync(TECH_PREFS_PATH, markdown, 'utf-8');
  } catch (err) {
    console.error('Failed to update technical-preferences.md:', err);
  }
}

export async function GET() {
  const config = readConfig();
  return NextResponse.json(config);
}

const VALID_ENGINES = ['godot', 'unity', 'unreal'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.engine && !VALID_ENGINES.includes(body.engine)) {
      return NextResponse.json(
        { error: `Invalid engine: ${body.engine}. Must be one of: ${VALID_ENGINES.join(', ')}` },
        { status: 400 }
      );
    }

    const config: EngineConfig = {
      ...DEFAULT_CONFIG,
      ...body,
    };

    writeConfig(config);
    return NextResponse.json({ success: true, config });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to save config: ${err}` },
      { status: 500 }
    );
  }
}
