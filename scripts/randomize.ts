import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'parameters.json');
const GENERATED_DIR = path.join(process.cwd(), 'config', 'generated');
const OUTPUTS_DIR = path.join(process.cwd(), 'outputs');

export async function randomizeJob(inputFile: string): Promise<string> {
  const configRaw = await fs.readFile(CONFIG_PATH, 'utf-8');
  const config = JSON.parse(configRaw);

  // Pick filter
  const filters = config.filters;
  const filterProbs = config.randomization.filterProbabilities;
  const filterIds = filters.map((f: any) => f.id);
  const filterWeights = filterIds.map((id: string) => filterProbs[id] || 0);
  const filterIdx = weightedRandomIndex(filterWeights);
  const selectedFilter = filters[filterIdx];

  // Pick speed
  let speed = 1.0;
  if (Math.random() < config.randomization.speed.probability) {
    const opts = config.randomization.speed.options;
    speed = opts[Math.floor(Math.random() * opts.length)];
  }

  // Pick clip
  const minF = config.clipLength.minFraction;
  const maxF = config.clipLength.maxFraction;
  const clipFraction = Math.random() * (maxF - minF) + minF;
  // For now, just use dummy values for start/end (real duration should be injected)
  const start = 0;
  const end = clipFraction * 100; // Placeholder for video duration

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
  await fs.mkdir(GENERATED_DIR, { recursive: true });
  await fs.writeFile(path.join(GENERATED_DIR, `${jobId}.json`), JSON.stringify(jobConfig, null, 2));
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