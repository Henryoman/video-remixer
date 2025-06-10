import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { log } from './logger';

const GENERATED_DIR = path.join(process.cwd(), 'config', 'generated');
const OUTPUTS_DIR = path.join(process.cwd(), 'outputs');
const DEFINE_PARAMETERS_PATH = path.join(process.cwd(), 'config', 'defineParameters.json');
const EDIT_PREFERENCES_PATH = path.join(process.cwd(), 'config', 'editPreferences.json');

export async function applyEdits(jobId: string): Promise<{ status: string; jobId: string; outputFile: string }> {
  await log('=== STARTING VIDEO PROCESSING ===');
  await log(`Job ID: ${jobId}`);
  
  // Load job config
  const jobPath = path.join(GENERATED_DIR, `${jobId}.json`);
  await log(`Looking for config at: ${jobPath}`);
  const jobRaw = await fs.readFile(jobPath, 'utf-8');
  const jobConfig = JSON.parse(jobRaw);
  await log(`Loaded job config: ${JSON.stringify(jobConfig, null, 2)}`);

  // Load master parameters and user preferences
  await log('Loading master config files...');
  const defineRaw = await fs.readFile(DEFINE_PARAMETERS_PATH, 'utf-8');
  const defineConfig = JSON.parse(defineRaw);
  await log(`Loaded defineParameters: ${JSON.stringify(defineConfig, null, 2)}`);
  
  const prefsRaw = await fs.readFile(EDIT_PREFERENCES_PATH, 'utf-8');
  const prefs = JSON.parse(prefsRaw);
  await log(`Loaded editPreferences: ${JSON.stringify(prefs, null, 2)}`);

  const { inputFile, outputFile, filter, clip } = jobConfig;
  await log('=== BUILDING FFMPEG COMMAND ===');
  await log(`Input File: ${inputFile}`);
  await log(`Output File: ${outputFile}`);
  await log(`Filter: ${filter ? filter.id : 'none'}`);
  await log(`Clip: ${clip ? `${clip.start}s - ${clip.end}s` : 'none'}`);

  // Build FFmpeg args array
  const args = [
    '-threads', '1',
    '-filter_threads', '1',
    '-max_alloc', '200M',
  ];
  if (prefs.randomizeClip && clip && typeof clip.start === 'number' && typeof clip.end === 'number') {
    args.push('-ss', clip.start.toString(), '-to', clip.end.toString());
  }
  args.push(
    '-y',
    '-i', inputFile,
    '-vf', 'scale=320:568',
    '-c:v', 'libx264',
    '-preset', 'veryslow',
    '-crf', '30',
    '-c:a', 'copy',
    outputFile
  );
  await log('=== FINAL FFMPEG ARGS ===');
  await log(JSON.stringify(args));

  // Run FFmpeg
  await log('=== EXECUTING FFMPEG ===');
  await new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args, { stdio: ['ignore', 'inherit', 'inherit'] });
    ffmpeg.on('close', async (code) => {
      if (code === 0) {
        await log('FFmpeg SUCCESS!');
        resolve();
      } else {
        await log(`FFmpeg exited with code ${code}`);
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
    ffmpeg.on('error', async (err) => {
      await log(`FFmpeg PROCESS ERROR: ${err.message}`);
      reject(err);
    });
  });

  await log('=== VIDEO PROCESSING COMPLETE ===');
  await log(`Job ID: ${jobId}`);
  await log(`Output file: ${outputFile}`);
  await log('Status: SUCCESS');
  
  return {
    status: 'success',
    jobId,
    outputFile
  };
} 