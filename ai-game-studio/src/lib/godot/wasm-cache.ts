// ============================================
// WASM Cache
// The Godot .wasm file (~33MB) is identical across
// all projects. Cache it to avoid re-serving from
// each build output.
// ============================================

import fs from 'fs';
import path from 'path';
import { getBuildsDir } from './assembler';

const CACHE_DIR = path.join(getBuildsDir(), '.cache');
const WASM_CACHE_FILE = path.join(CACHE_DIR, 'godot-web.wasm');

/**
 * Cache the .wasm file from a build output.
 */
export function cacheWasm(buildOutputDir: string): boolean {
  try {
    const wasmSource = path.join(buildOutputDir, 'index.wasm');
    if (!fs.existsSync(wasmSource)) return false;

    // Don't re-cache if already exists and same size
    if (fs.existsSync(WASM_CACHE_FILE)) {
      const sourceSize = fs.statSync(wasmSource).size;
      const cacheSize = fs.statSync(WASM_CACHE_FILE).size;
      if (sourceSize === cacheSize) return true;
    }

    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.copyFileSync(wasmSource, WASM_CACHE_FILE);
    console.log('[WasmCache] Cached wasm file');
    return true;
  } catch (err) {
    console.error('[WasmCache] Failed to cache:', err);
    return false;
  }
}

/**
 * Get the cached .wasm file path, or null if not cached.
 */
export function getCachedWasmPath(): string | null {
  if (fs.existsSync(WASM_CACHE_FILE)) {
    return WASM_CACHE_FILE;
  }
  return null;
}

/**
 * Get cache info.
 */
export function getCacheInfo(): { exists: boolean; sizeMb: number; path: string } {
  if (fs.existsSync(WASM_CACHE_FILE)) {
    const stat = fs.statSync(WASM_CACHE_FILE);
    return {
      exists: true,
      sizeMb: Math.round(stat.size / 1024 / 1024 * 10) / 10,
      path: WASM_CACHE_FILE,
    };
  }
  return { exists: false, sizeMb: 0, path: WASM_CACHE_FILE };
}
