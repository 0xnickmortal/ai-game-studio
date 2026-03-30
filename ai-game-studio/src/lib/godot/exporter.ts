// ============================================
// Godot Headless Web Exporter
// Runs `godot --headless --export-release "Web"`
// on an assembled project directory
// ============================================

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/** Build result from the export process */
export interface BuildResult {
  success: boolean;
  buildId: string;
  outputDir: string;
  outputFiles: string[];
  error?: string;
  stderr?: string;
  durationMs: number;
}

/** Options for the export process */
export interface ExportOptions {
  /** Timeout in milliseconds (default: 60000) */
  timeout?: number;
  /** Godot binary path override */
  godotPath?: string;
}

/**
 * Locate the Godot binary.
 * Search order:
 * 1. Explicit path from engine config
 * 2. GODOT_PATH environment variable
 * 3. Common Windows installation paths
 * 4. PATH (just try 'godot')
 */
export function findGodotBinary(configuredPath?: string): string {
  // 1. Explicit configured path
  if (configuredPath && fs.existsSync(configuredPath)) {
    return configuredPath;
  }

  // 2. Environment variable
  const envPath = process.env.GODOT_PATH;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  // 3. Common Windows paths
  const commonPaths = [
    'C:\\Godot\\godot.exe',
    'C:\\Godot\\Godot_v4.5-stable_win64.exe',
    'C:\\Godot\\Godot_v4.4-stable_win64.exe',
    'C:\\Program Files\\Godot\\godot.exe',
    'C:\\Program Files (x86)\\Godot\\godot.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Godot', 'godot.exe'),
    path.join(process.env.USERPROFILE || '', 'scoop', 'apps', 'godot', 'current', 'godot.exe'),
  ];

  for (const p of commonPaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }

  // 4. Fall back to PATH
  return 'godot';
}

/**
 * Check if Godot web export templates are installed.
 */
export function checkExportTemplates(): { installed: boolean; path: string; message: string } {
  const appData = process.env.APPDATA || '';
  const templatesBase = path.join(appData, 'Godot', 'export_templates');

  if (!fs.existsSync(templatesBase)) {
    return {
      installed: false,
      path: templatesBase,
      message: '导出模板目录不存在。请在 Godot 编辑器中下载导出模板：Editor → Manage Export Templates → Download',
    };
  }

  // Look for any 4.x template folder
  try {
    const versions = fs.readdirSync(templatesBase);
    const v4Template = versions.find(v => v.startsWith('4.'));
    if (!v4Template) {
      return {
        installed: false,
        path: templatesBase,
        message: '未找到 Godot 4.x 导出模板。请在 Godot 编辑器中下载：Editor → Manage Export Templates',
      };
    }

    // Check for web template files
    const templateDir = path.join(templatesBase, v4Template);
    const webFiles = fs.readdirSync(templateDir).filter(f => f.includes('web'));
    if (webFiles.length === 0) {
      return {
        installed: false,
        path: templateDir,
        message: `找到模板目录 ${v4Template}，但缺少 Web 导出模板文件。`,
      };
    }

    return {
      installed: true,
      path: templateDir,
      message: `Web 导出模板已就绪 (${v4Template})`,
    };
  } catch {
    return {
      installed: false,
      path: templatesBase,
      message: '无法读取导出模板目录',
    };
  }
}

/**
 * Run `godot --headless --export-release "Web"` on a project.
 */
export async function exportGodotProject(
  projectDir: string,
  outputDir: string,
  buildId: string,
  options: ExportOptions = {}
): Promise<BuildResult> {
  const timeout = options.timeout || 60000;
  const godotBinary = findGodotBinary(options.godotPath);
  const outputFile = path.join(outputDir, 'index.html');
  const startTime = Date.now();

  console.log(`[Exporter] Starting build ${buildId}`);
  console.log(`[Exporter] Godot binary: ${godotBinary}`);
  console.log(`[Exporter] Project dir: ${projectDir}`);
  console.log(`[Exporter] Output: ${outputFile}`);

  return new Promise((resolve) => {
    const args = [
      '--headless',
      '--path', projectDir,
      '--export-release', 'Web',
      outputFile,
    ];

    const child = spawn(godotBinary, args, {
      shell: true,
      timeout,
      windowsHide: true,
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      stdout += text;
      // Log progress
      if (text.includes('Exporting') || text.includes('export')) {
        console.log(`[Exporter] ${text.trim()}`);
      }
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      const durationMs = Date.now() - startTime;
      console.log(`[Exporter] Build ${buildId} finished in ${durationMs}ms (code: ${code}, stdout: ${stdout.length}chars, stderr: ${stderr.length}chars)`);

      // Check if output files exist
      const expectedFiles = [
        'index.html', 'index.js', 'index.wasm', 'index.pck',
        'index.png', 'index.audio.worklet.js',
      ];
      const existingFiles = expectedFiles.filter(f =>
        fs.existsSync(path.join(outputDir, f))
      );

      if (code !== 0 || existingFiles.length < 3) {
        // Parse common errors
        let errorMsg = `Godot export failed (code: ${code})`;
        if (stderr.includes('No export template found')) {
          errorMsg = '缺少 Web 导出模板。请在 Godot 编辑器中安装：Editor → Manage Export Templates';
        } else if (stderr.includes('export_presets.cfg')) {
          errorMsg = '导出预设配置错误';
        } else if (stderr.includes('Parse Error') || stderr.includes('SCRIPT ERROR')) {
          // Extract script errors
          const scriptErrors = stderr.match(/SCRIPT ERROR:.*|Parse Error:.*|Error:.*\.gd.*/g);
          errorMsg = `GDScript 语法错误:\n${scriptErrors?.join('\n') || stderr.slice(0, 500)}`;
        } else if (stderr) {
          errorMsg = stderr.slice(0, 1000);
        }

        resolve({
          success: false,
          buildId,
          outputDir,
          outputFiles: existingFiles,
          error: errorMsg,
          stderr: stderr.slice(0, 2000),
          durationMs,
        });
        return;
      }

      resolve({
        success: true,
        buildId,
        outputDir,
        outputFiles: existingFiles,
        durationMs,
      });
    });

    child.on('error', (err) => {
      const durationMs = Date.now() - startTime;
      let errorMsg = `无法启动 Godot: ${err.message}`;
      if (err.message.includes('ENOENT')) {
        errorMsg = `找不到 Godot 可执行文件。请设置 GODOT_PATH 环境变量或在引擎配置中指定路径。\n尝试路径: ${godotBinary}`;
      }

      resolve({
        success: false,
        buildId,
        outputDir,
        outputFiles: [],
        error: errorMsg,
        durationMs,
      });
    });
  });
}

/**
 * Get the Godot version from CLI.
 */
export async function getGodotVersion(godotPath?: string): Promise<string | null> {
  const binary = findGodotBinary(godotPath);

  return new Promise((resolve) => {
    const child = spawn(binary, ['--version', '--headless'], {
      shell: true,
      timeout: 10000,
      windowsHide: true,
    });

    let stdout = '';
    child.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
    child.on('close', (code) => {
      if (code === 0 && stdout.trim()) {
        resolve(stdout.trim());
      } else {
        resolve(null);
      }
    });
    child.on('error', () => resolve(null));
  });
}
