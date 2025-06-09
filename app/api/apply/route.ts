import { NextResponse } from 'next/server';
import { applyEdits } from '../../../scripts/applyEdits';

export async function POST(req: Request) {
  const { jobId } = await req.json();
  const result = await applyEdits(jobId);
  return NextResponse.json(result);
} 