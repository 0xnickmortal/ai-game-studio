// ============================================
// GET /api/project/status - Detect project stage
// ============================================

import { NextResponse } from 'next/server';
import { detectProjectStatus } from '@/lib/project/detector';

export async function GET() {
  try {
    const status = detectProjectStatus();
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to detect project status: ${err}` },
      { status: 500 }
    );
  }
}
