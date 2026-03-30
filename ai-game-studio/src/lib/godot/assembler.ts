// ============================================
// Godot Project Assembler
// Takes AI-generated code and creates a complete
// Godot project that can be exported headlessly
// ============================================

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const BUILDS_DIR = path.join(process.cwd(), 'builds');

/** Result of assembling a Godot project */
export interface AssembleResult {
  buildId: string;
  projectDir: string;
  outputDir: string;
  files: string[];
  error?: string;
}

/** Parsed file from AI output */
interface ParsedFile {
  path: string; // e.g. "res://scripts/player.gd" or "scripts/player.gd"
  content: string;
}

/**
 * Parse AI-generated code output into individual files.
 * Supports delimiters like:
 *   # ===== FILE: res://scripts/player.gd =====
 *   // ===== FILE: res://scripts/player.gd =====
 *   ## FILE: res://scripts/player.gd
 */
function parseGeneratedCode(code: string): ParsedFile[] {
  const files: ParsedFile[] = [];
  // Match various file delimiter patterns
  const filePattern = /^[#\/\*\s]*={3,}\s*FILE:\s*(.*?)\s*={0,}$/gm;

  const matches: { index: number; filePath: string }[] = [];
  let match;
  while ((match = filePattern.exec(code)) !== null) {
    let filePath = match[1].trim();
    // Remove res:// prefix
    filePath = filePath.replace(/^res:\/\//, '');
    // Remove trailing = signs
    filePath = filePath.replace(/\s*=+\s*$/, '');
    matches.push({ index: match.index + match[0].length, filePath });
  }

  if (matches.length === 0) {
    // No file delimiters found — treat entire code as a single main.gd
    return [{ path: 'scripts/main.gd', content: code.trim() }];
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length
      ? code.lastIndexOf('\n', matches[i + 1].index - matches[i + 1].filePath.length - 20)
      : code.length;
    const content = code.slice(start, end).trim();
    if (content) {
      files.push({ path: matches[i].filePath, content });
    }
  }

  return files;
}

/**
 * Extract .tscn scene content from comments in the generated code.
 * AI is prompted to include scene file content in comment blocks.
 */
function extractSceneFromComments(code: string): string | null {
  // Look for tscn content in comments
  const tscnPattern = /(?:#|\/\/)\s*-+\s*(?:SCENE|TSCN|Scene File).*?\n((?:(?:#|\/\/)\s*.*\n)*)/gi;
  const match = tscnPattern.exec(code);
  if (match) {
    // Remove comment prefixes
    const lines = match[1].split('\n')
      .map(line => line.replace(/^(?:#|\/\/)\s?/, ''))
      .join('\n')
      .trim();
    if (lines.includes('[gd_scene') || lines.includes('[node')) {
      return lines;
    }
  }

  // Also look for raw tscn blocks
  const rawPattern = /\[gd_scene[\s\S]*?\[node name=[\s\S]*?(?=\n# =====|\n\/\/ =====|$)/;
  const rawMatch = rawPattern.exec(code);
  if (rawMatch) {
    return rawMatch[0].trim();
  }

  return null;
}

/**
 * Generate a minimal main.tscn scene file.
 * Used as fallback when AI doesn't produce a proper scene file.
 */
function generateMinimalScene(mainScriptPath: string): string {
  return `[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://${mainScriptPath}" id="1_main"]

[node name="Main" type="Node2D"]
script = ExtResource("1_main")
`;
}

/**
 * Generate a project.godot file.
 */
function generateProjectGodot(gameName: string, mainScene: string = 'res://main.tscn', version: string = '4.5'): string {
  return `; Godot Engine project file (auto-generated)
config_version=5

[application]

config/name="${gameName.replace(/"/g, '\\"')}"
run/main_scene="${mainScene}"
config/features=PackedStringArray("${version}", "GL Compatibility")

[display]

window/size/viewport_width=960
window/size/viewport_height=540
window/stretch/mode="canvas_items"

[rendering]

renderer/rendering_method="gl_compatibility"
renderer/rendering_method.web="gl_compatibility"
`;
}

/**
 * Generate export_presets.cfg for Web export (threads disabled).
 */
function generateExportPresets(): string {
  return `[preset.0]

name="Web"
platform="Web"
runnable=true
dedicated_server=false
custom_features=""
export_filter="all_resources"
include_filter=""
exclude_filter=""
export_path=""
patches=PackedStringArray()
encryption_include_filters=""
encryption_exclude_filters=""
encrypt_pck=false
encrypt_directory=false

[preset.0.options]

custom_template/debug=""
custom_template/release=""
variant/extensions_support=false
variant/thread_support=false
vram_texture_compression/for_desktop=true
vram_texture_compression/for_mobile=false
html/export_icon=true
html/custom_html_shell=""
html/head_include=""
html/canvas_resize_policy=1
html/focus_canvas_on_start=true
html/experimental_virtual_keyboard=false
progressive_web_app/enabled=false
progressive_web_app/offline_page=""
progressive_web_app/display=1
progressive_web_app/orientation=0
progressive_web_app/icon_144x144=""
progressive_web_app/icon_180x180=""
progressive_web_app/icon_512x512=""
progressive_web_app/background_color=Color(0, 0, 0, 1)
`;
}

/**
 * Clean up old build directories (older than 1 hour).
 */
function cleanOldBuilds(): void {
  try {
    if (!fs.existsSync(BUILDS_DIR)) return;
    const entries = fs.readdirSync(BUILDS_DIR);
    const cutoff = Date.now() - 60 * 60 * 1000; // 1 hour

    for (const entry of entries) {
      if (entry === '.cache') continue; // Don't delete wasm cache
      const fullPath = path.join(BUILDS_DIR, entry);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && stat.mtimeMs < cutoff) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`[Assembler] Cleaned old build: ${entry}`);
        }
      } catch {
        // Ignore individual cleanup errors
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Assemble a complete Godot project from AI-generated code.
 *
 * @param code - The raw AI-generated code (may contain file delimiters)
 * @param gameName - Name for the game project
 * @returns AssembleResult with project directory path
 */
export async function assembleGodotProject(
  code: string,
  gameName: string,
  engineVersion: string = '4.5'
): Promise<AssembleResult> {
  const buildId = randomUUID().slice(0, 8) + '-' + Date.now();
  const projectDir = path.join(BUILDS_DIR, buildId, 'project');
  const outputDir = path.join(BUILDS_DIR, buildId, 'output');
  const writtenFiles: string[] = [];

  try {
    // Clean old builds
    cleanOldBuilds();

    // Create directories
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });

    // Parse generated code into files
    const parsedFiles = parseGeneratedCode(code);

    // Write all parsed files
    for (const file of parsedFiles) {
      const filePath = path.join(projectDir, file.path);
      const fileDir = path.dirname(filePath);
      fs.mkdirSync(fileDir, { recursive: true });
      fs.writeFileSync(filePath, file.content, 'utf-8');
      writtenFiles.push(file.path);
    }

    // Check if we have a main scene
    const hasScene = parsedFiles.some(f => f.path.endsWith('.tscn'));

    if (!hasScene) {
      // Try to extract scene from comments
      const sceneContent = extractSceneFromComments(code);

      if (sceneContent) {
        const scenePath = path.join(projectDir, 'main.tscn');
        fs.writeFileSync(scenePath, sceneContent, 'utf-8');
        writtenFiles.push('main.tscn');
      } else {
        // Generate minimal scene
        // Find main script - prefer scripts/main.gd, scripts/game_manager.gd, or first .gd
        const mainScript = parsedFiles.find(f => f.path.includes('main.gd'))
          || parsedFiles.find(f => f.path.includes('game_manager.gd'))
          || parsedFiles.find(f => f.path.endsWith('.gd'));

        const scriptPath = mainScript?.path || 'scripts/main.gd';
        const sceneStr = generateMinimalScene(scriptPath);
        const scenePath = path.join(projectDir, 'main.tscn');
        fs.writeFileSync(scenePath, sceneStr, 'utf-8');
        writtenFiles.push('main.tscn');
      }
    }

    // Generate project.godot
    const projectGodot = generateProjectGodot(gameName, 'res://main.tscn', engineVersion);
    fs.writeFileSync(path.join(projectDir, 'project.godot'), projectGodot, 'utf-8');
    writtenFiles.push('project.godot');

    // Generate export_presets.cfg
    const exportPresets = generateExportPresets();
    fs.writeFileSync(path.join(projectDir, 'export_presets.cfg'), exportPresets, 'utf-8');
    writtenFiles.push('export_presets.cfg');

    console.log(`[Assembler] Project assembled: ${buildId} (${writtenFiles.length} files)`);

    return {
      buildId,
      projectDir,
      outputDir,
      files: writtenFiles,
    };
  } catch (err) {
    return {
      buildId,
      projectDir,
      outputDir,
      files: writtenFiles,
      error: `Assembly failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/** Get the builds directory path */
export function getBuildsDir(): string {
  return BUILDS_DIR;
}
