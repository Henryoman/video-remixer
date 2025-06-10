import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
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

  // Build FFmpeg command
  let ffmpegCmd = `ffmpeg -y -i "${inputFile}"`;
  await log(`Base command: ${ffmpegCmd}`);

  // Clipping (if enabled)
  if (prefs.randomizeClip && clip && typeof clip.start === 'number' && typeof clip.end === 'number') {
    ffmpegCmd += ` -ss ${clip.start} -to ${clip.end}`;
    await log(`Added clipping: -ss ${clip.start} -to ${clip.end}`);
  } else {
    await log(`Clipping SKIPPED: ${JSON.stringify({
      randomizeClipEnabled: prefs.randomizeClip,
      clipExists: !!clip,
      startValid: clip && typeof clip.start === 'number',
      endValid: clip && typeof clip.end === 'number'
    })}`);
  }

  // Color Mix (if enabled)
  if (filter && prefs.filters[filter.id]) {
    await log(`Filter ${filter.id} is enabled in preferences`);
    // Find the filter definition for parameters
    const filterDef = defineConfig.filters.find((f: any) => f.id === filter.id);
    await log(`Found filter definition: ${JSON.stringify(filterDef)}`);
    if (filterDef && filterDef.parameters && filter.id.startsWith('color_mix')) {
      // Use hue filter for a subtle color shift
      // For a 5% shift, hue=s=1.0:r=0.02 (very subtle rotation)
      const colorShift = filterDef.parameters.colorTemperature > 0 ? 0.02 : -0.02;
      const hueFilter = ` -vf "hue=h=${colorShift}:s=1"`;
      ffmpegCmd += hueFilter;
      await log(`Added color filter: ${hueFilter}`);
    }
  } else {
    await log(`Color filter SKIPPED: ${JSON.stringify({
      filterExists: !!filter,
      filterEnabled: filter ? prefs.filters[filter.id] : false,
      availableFilters: Object.keys(prefs.filters)
    })}`);
  }

  ffmpegCmd += ` -c:a copy "${outputFile}"`;
  await log('=== FINAL FFMPEG COMMAND ===');
  await log(ffmpegCmd);

  // Run FFmpeg
  await log('=== EXECUTING FFMPEG ===');
  await new Promise<void>((resolve, reject) => {
    exec(ffmpegCmd, { maxBuffer: 1024 * 1024 * 10 }, async (error, stdout, stderr) => {
      if (error) {
        await log(`FFmpeg ERROR: ${error.message}`);
        await log(`FFmpeg STDERR: ${stderr}`);
        reject(new Error(stderr));
      } else {
        await log('FFmpeg SUCCESS!');
        await log(`FFmpeg STDOUT: ${stdout}`);
        await log(`FFmpeg STDERR: ${stderr}`);
        resolve();
      }
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