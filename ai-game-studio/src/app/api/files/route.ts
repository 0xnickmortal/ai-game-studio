// ============================================
// GET /api/files?path=design - Browse project files
// GET /api/files?path=design/gdd/combat.md&read=true - Read file content
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PROJECT_ROOT } from '@/lib/paths';

// Allowed top-level directories (security: prevent arbitrary filesystem access)
const ALLOWED_DIRS = ['design', 'docs', 'src', 'assets', 'tests', 'tools', 'prototypes', 'production', '.claude'];

interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
}

function isAllowedPath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  // Must start with an allowed directory
  return ALLOWED_DIRS.some(dir => normalized === dir || normalized.startsWith(dir + '/'));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const relativePath = searchParams.get('path') || '';
  const readFile = searchParams.get('read') === 'true';

  // Root listing: show allowed directories
  if (!relativePath) {
    const entries: FileEntry[] = ALLOWED_DIRS
      .filter(dir => {
        const fullPath = path.join(PROJECT_ROOT, dir);
        return fs.existsSync(fullPath);
      })
      .map(dir => ({
        name: dir,
        path: dir,
        type: 'directory' as const,
      }));

    return NextResponse.json({ entries, currentPath: '' });
  }

  // Security check
  if (!isAllowedPath(relativePath)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const fullPath = path.join(PROJECT_ROOT, relativePath);

  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ error: 'Path not found' }, { status: 404 });
  }

  const stat = fs.statSync(fullPath);

  // Read file content
  if (readFile && stat.isFile()) {
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      return NextResponse.json({
        name: path.basename(fullPath),
        path: relativePath,
        content,
        size: stat.size,
      });
    } catch {
      return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
    }
  }

  // List directory
  if (stat.isDirectory()) {
    try {
      const items = fs.readdirSync(fullPath);
      const entries: FileEntry[] = items
        .filter(name => !name.startsWith('.') || relativePath === '.claude')
        .map(name => {
          const itemPath = path.join(fullPath, name);
          try {
            const itemStat = fs.statSync(itemPath);
            return {
              name,
              path: path.join(relativePath, name).replace(/\\/g, '/'),
              type: itemStat.isDirectory() ? 'directory' as const : 'file' as const,
              size: itemStat.isFile() ? itemStat.size : undefined,
              extension: itemStat.isFile() ? path.extname(name) : undefined,
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean) as FileEntry[];

      // Sort: directories first, then files
      entries.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      return NextResponse.json({ entries, currentPath: relativePath });
    } catch {
      return NextResponse.json({ error: 'Failed to list directory' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
}
