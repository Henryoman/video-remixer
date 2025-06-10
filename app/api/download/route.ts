import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const GENERATED_DIR = path.join(process.cwd(), 'config', 'generated');
const OUTPUTS_DIR = path.join(process.cwd(), 'outputs');

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }
  const jobPath = path.join(GENERATED_DIR, `${jobId}.json`);
  try {
    const jobRaw = await fs.readFile(jobPath, 'utf-8');
    const jobConfig = JSON.parse(jobRaw);
    const outputFile = jobConfig.outputFile;
    const fileBuffer = await fs.readFile(outputFile);
    // Clean up video file but keep config for analysis
    await fs.unlink(outputFile).catch(() => {});
    // Keep jobPath (config) for historical analysis
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${path.basename(outputFile)}"`
      }
    });
  } catch (err) {
    return NextResponse.json({ error: 'File not found or error reading file' }, { status: 404 });
  }
} 