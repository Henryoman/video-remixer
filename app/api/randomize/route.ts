import { NextResponse } from 'next/server';
import { randomizeJob } from '../../../scripts/randomize';

export async function POST(req: Request) {
  const { inputFile } = await req.json();
  const jobId = await randomizeJob(inputFile);
  return NextResponse.json({ jobId });
} 