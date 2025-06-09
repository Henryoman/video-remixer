import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const DEFINE_PARAMETERS_PATH = path.join(process.cwd(), 'config', 'defineParameters.json');
const EDIT_PREFERENCES_PATH = path.join(process.cwd(), 'config', 'editPreferences.json');
const GENERATED_DIR = path.join(process.cwd(), 'config', 'generated');
const OUTPUTS_DIR = path.join(process.cwd(), 'outputs');

async function getVideoDuration(inputFile: string): Promise<number> {
  const { stdout } = await execAsync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${inputFile}"`);
  return parseFloat(stdout.trim());
}

export async function randomizeJob(inputFile: string): Promise<string> {
  // Get video duration
  const videoDuration = await getVideoDuration(inputFile);

  // Load configurations
  const defineRaw = await fs.readFile(DEFINE_PARAMETERS_PATH, 'utf-8');
  const defineConfig = JSON.parse(defineRaw);
  const prefsRaw = await fs.readFile(EDIT_PREFERENCES_PATH, 'utf-8');
  const prefs = JSON.parse(prefsRaw);

  // Pick filter from enabled ones
  const enabledFilters = defineConfig.filters.filter((f: any) => prefs.filters[f.id]);
  const selectedFilter = enabledFilters[Math.floor(Math.random() * enabledFilters.length)];

  // Pick speed (disabled in prefs)
  let speed = 1.0;

  // Pick clip
  const minF = prefs.clipLength.min;
  const maxF = prefs.clipLength.max;
  const clipFraction = Math.random() * (maxF - minF) + minF;
  const clipDuration = videoDuration * clipFraction;
  const maxStartTime = videoDuration - clipDuration;
  const start = Math.random() * maxStartTime;
  const end = start + clipDuration;

  // Write generated config
  const jobId = randomUUID();
  await fs.mkdir(OUTPUTS_DIR, { recursive: true });
  const outputFile = path.join(OUTPUTS_DIR, `output-${jobId}.mp4`);
  const jobConfig = {
    jobId,
    inputFile,
    outputFile,
    filter: selectedFilter,
    clip: { start, end },
    speed
  };
  
  console.log('=== VIDEO PROCESSING CONFIG GENERATED ===');
  console.log(`Job ID: ${jobId}`);
  console.log(`Input File: ${inputFile}`);
  console.log(`Output File: ${outputFile}`);
  console.log(`Video Duration: ${videoDuration.toFixed(2)}s`);
  console.log(`Selected Filter: ${selectedFilter.id} - ${selectedFilter.name}`);
  console.log(`Clip: ${start.toFixed(2)}s - ${end.toFixed(2)}s (${clipDuration.toFixed(2)}s of ${videoDuration.toFixed(2)}s)`);
  console.log(`Speed: ${speed}x`);
  console.log(`Full Config:`, JSON.stringify(jobConfig, null, 2));
  
  await fs.mkdir(GENERATED_DIR, { recursive: true });
  const configPath = path.join(GENERATED_DIR, `${jobId}.json`);
  await fs.writeFile(configPath, JSON.stringify(jobConfig, null, 2));
  console.log(`Config saved to: ${configPath}`);
  console.log('=== CONFIG GENERATION COMPLETE ===');
  return jobId;
}

function weightedRandomIndex(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    if (r < weights[i]) return i;
    r -= weights[i];
  }
  return weights.length - 1;
} 