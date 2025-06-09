import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';

const GENERATED_DIR = path.join(process.cwd(), 'config', 'generated');
const OUTPUTS_DIR = path.join(process.cwd(), 'outputs');
const DEFINE_PARAMETERS_PATH = path.join(process.cwd(), 'config', 'defineParameters.json');
const EDIT_PREFERENCES_PATH = path.join(process.cwd(), 'config', 'editPreferences.json');

export async function applyEdits(jobId: string): Promise<{ status: string; jobId: string; outputFile: string }> {
  // Load job config
  const jobPath = path.join(GENERATED_DIR, `${jobId}.json`);
  const jobRaw = await fs.readFile(jobPath, 'utf-8');
  const jobConfig = JSON.parse(jobRaw);

  // Load master parameters and user preferences
  const defineRaw = await fs.readFile(DEFINE_PARAMETERS_PATH, 'utf-8');
  const defineConfig = JSON.parse(defineRaw);
  const prefsRaw = await fs.readFile(EDIT_PREFERENCES_PATH, 'utf-8');
  const prefs = JSON.parse(prefsRaw);

  const { inputFile, outputFile, filter, clip } = jobConfig;

  // Build FFmpeg command
  let ffmpegCmd = `ffmpeg -y -i "${inputFile}"`;

  // Clipping (if enabled)
  if (prefs.randomizeClip && clip && typeof clip.start === 'number' && typeof clip.end === 'number') {
    ffmpegCmd += ` -ss ${clip.start} -to ${clip.end}`;
  }

  // Color Mix (if enabled)
  if (filter && prefs.filters[filter.id]) {
    // Find the filter definition for parameters
    const filterDef = defineConfig.filters.find((f: any) => f.id === filter.id);
    if (filterDef && filterDef.parameters && filter.id.startsWith('color_mix')) {
      // Use hue filter for a subtle color shift
      // For a 5% shift, hue=s=1.0:r=0.02 (very subtle rotation)
      const colorShift = filterDef.parameters.colorTemperature > 0 ? 0.02 : -0.02;
      ffmpegCmd += ` -vf "hue=h=${colorShift}:s=1"`;
    }
  }

  ffmpegCmd += ` -c:a copy "${outputFile}"`;

  // Run FFmpeg
  await new Promise<void>((resolve, reject) => {
    exec(ffmpegCmd, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr));
      } else {
        resolve();
      }
    });
  });

  return {
    status: 'success',
    jobId,
    outputFile
  };
} 