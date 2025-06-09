import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';

const GENERATED_DIR = path.join(process.cwd(), 'config', 'generated');
const OUTPUTS_DIR = path.join(process.cwd(), 'outputs');
const DEFINE_PARAMETERS_PATH = path.join(process.cwd(), 'config', 'defineParameters.json');
const EDIT_PREFERENCES_PATH = path.join(process.cwd(), 'config', 'editPreferences.json');

export async function applyEdits(jobId: string): Promise<{ status: string; jobId: string; outputFile: string }> {
  console.log('=== STARTING VIDEO PROCESSING ===');
  console.log(`Job ID: ${jobId}`);
  
  // Load job config
  const jobPath = path.join(GENERATED_DIR, `${jobId}.json`);
  console.log(`Looking for config at: ${jobPath}`);
  const jobRaw = await fs.readFile(jobPath, 'utf-8');
  const jobConfig = JSON.parse(jobRaw);
  console.log('Loaded job config:', JSON.stringify(jobConfig, null, 2));

  // Load master parameters and user preferences
  console.log('Loading master config files...');
  const defineRaw = await fs.readFile(DEFINE_PARAMETERS_PATH, 'utf-8');
  const defineConfig = JSON.parse(defineRaw);
  console.log('Loaded defineParameters:', JSON.stringify(defineConfig, null, 2));
  
  const prefsRaw = await fs.readFile(EDIT_PREFERENCES_PATH, 'utf-8');
  const prefs = JSON.parse(prefsRaw);
  console.log('Loaded editPreferences:', JSON.stringify(prefs, null, 2));

  const { inputFile, outputFile, filter, clip } = jobConfig;
  console.log('=== BUILDING FFMPEG COMMAND ===');
  console.log(`Input File: ${inputFile}`);
  console.log(`Output File: ${outputFile}`);
  console.log(`Filter: ${filter ? filter.id : 'none'}`);
  console.log(`Clip: ${clip ? `${clip.start}s - ${clip.end}s` : 'none'}`);

  // Build FFmpeg command
  let ffmpegCmd = `ffmpeg -y -i "${inputFile}"`;
  console.log('Base command:', ffmpegCmd);

  // Clipping (if enabled)
  if (prefs.randomizeClip && clip && typeof clip.start === 'number' && typeof clip.end === 'number') {
    ffmpegCmd += ` -ss ${clip.start} -to ${clip.end}`;
    console.log('Added clipping:', `-ss ${clip.start} -to ${clip.end}`);
  } else {
    console.log('Clipping SKIPPED:', {
      randomizeClipEnabled: prefs.randomizeClip,
      clipExists: !!clip,
      startValid: clip && typeof clip.start === 'number',
      endValid: clip && typeof clip.end === 'number'
    });
  }

  // Color Mix (if enabled)
  if (filter && prefs.filters[filter.id]) {
    console.log(`Filter ${filter.id} is enabled in preferences`);
    // Find the filter definition for parameters
    const filterDef = defineConfig.filters.find((f: any) => f.id === filter.id);
    console.log('Found filter definition:', filterDef);
    if (filterDef && filterDef.parameters && filter.id.startsWith('color_mix')) {
      // Use hue filter for a subtle color shift
      // For a 5% shift, hue=s=1.0:r=0.02 (very subtle rotation)
      const colorShift = filterDef.parameters.colorTemperature > 0 ? 0.02 : -0.02;
      const hueFilter = ` -vf "hue=h=${colorShift}:s=1"`;
      ffmpegCmd += hueFilter;
      console.log('Added color filter:', hueFilter);
    }
  } else {
    console.log('Color filter SKIPPED:', {
      filterExists: !!filter,
      filterEnabled: filter ? prefs.filters[filter.id] : false,
      availableFilters: Object.keys(prefs.filters)
    });
  }

  ffmpegCmd += ` -c:a copy "${outputFile}"`;
  console.log('=== FINAL FFMPEG COMMAND ===');
  console.log(ffmpegCmd);

  // Run FFmpeg
  console.log('=== EXECUTING FFMPEG ===');
  await new Promise<void>((resolve, reject) => {
    exec(ffmpegCmd, (error, stdout, stderr) => {
      if (error) {
        console.log('FFmpeg ERROR:', error.message);
        console.log('FFmpeg STDERR:', stderr);
        reject(new Error(stderr));
      } else {
        console.log('FFmpeg SUCCESS!');
        console.log('FFmpeg STDOUT:', stdout);
        console.log('FFmpeg STDERR:', stderr);
        resolve();
      }
    });
  });

  console.log('=== VIDEO PROCESSING COMPLETE ===');
  console.log(`Job ID: ${jobId}`);
  console.log(`Output file: ${outputFile}`);
  console.log('Status: SUCCESS');
  
  return {
    status: 'success',
    jobId,
    outputFile
  };
} 