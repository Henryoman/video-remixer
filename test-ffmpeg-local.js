#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 FFmpeg Local Memory Test Script');
console.log('=====================================');

// Check if input file exists
const inputFile = process.argv[2];
if (!inputFile) {
  console.error('❌ Usage: node test-ffmpeg-local.js <input-video-file>');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Input file not found: ${inputFile}`);
  process.exit(1);
}

const outputFile = `test-output-${Date.now()}.mp4`;
const startTime = Date.now();

// Monitor memory usage
let peakMemory = 0;
const memoryInterval = setInterval(() => {
  const usage = process.memoryUsage();
  const currentMemory = usage.rss / 1024 / 1024; // MB
  peakMemory = Math.max(peakMemory, currentMemory);
}, 100);

// FFmpeg args matching production
const ffmpegArgs = [
  '-threads', '1',
  '-filter_threads', '1',
  '-y',
  '-i', inputFile,
  '-vf', 'scale=320:568',
  '-crf', '30',
  '-preset', 'medium',
  '-c:a', 'copy',
  outputFile
];

console.log(`📝 Input: ${inputFile}`);
console.log(`📝 Output: ${outputFile}`);
console.log(`📝 Command: ffmpeg ${ffmpegArgs.join(' ')}`);
console.log('');
console.log('🚀 Starting ffmpeg process...');

const ffmpeg = spawn('ffmpeg', ffmpegArgs, { 
  stdio: ['ignore', 'pipe', 'pipe'] 
});

let stdoutData = '';
let stderrData = '';

ffmpeg.stdout.on('data', (data) => {
  stdoutData += data.toString();
});

ffmpeg.stderr.on('data', (data) => {
  const output = data.toString();
  stderrData += output;
  
  // Show progress frames
  const frameMatch = output.match(/frame=\s*(\d+)/);
  if (frameMatch) {
    process.stdout.write(`\r📊 Processing frame: ${frameMatch[1]}`);
  }
});

ffmpeg.on('close', (code) => {
  clearInterval(memoryInterval);
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log('\n');
  console.log('📊 RESULTS');
  console.log('=====================================');
  console.log(`✅ Exit Code: ${code}`);
  console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
  console.log(`🧠 Peak Memory: ${peakMemory.toFixed(2)} MB`);
  
  if (fs.existsSync(outputFile)) {
    const stats = fs.statSync(outputFile);
    console.log(`📁 Output Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  }
  
  console.log('');
  
  if (code === 0) {
    console.log('✅ SUCCESS: FFmpeg completed successfully!');
    
    // Test different memory limits
    console.log('');
    console.log('🔬 MEMORY ANALYSIS:');
    const railwayLimits = {
      'Free Plan': 512,
      'Developer Plan': 1024,
      'Team Plan': 2048
    };
    
    Object.entries(railwayLimits).forEach(([plan, limit]) => {
      const status = peakMemory <= limit ? '✅' : '❌';
      console.log(`${status} ${plan}: ${limit}MB (Peak: ${peakMemory.toFixed(2)}MB)`);
    });
    
  } else if (code === 137) {
    console.log('❌ KILLED: Process was terminated (OOM or resource limit)');
  } else {
    console.log(`❌ FAILED: FFmpeg exited with code ${code}`);
  }
  
  // Show last few lines of stderr for debugging
  if (stderrData && code !== 0) {
    console.log('');
    console.log('🐛 LAST ERROR OUTPUT:');
    console.log(stderrData.split('\n').slice(-10).join('\n'));
  }
  
  // Cleanup
  if (fs.existsSync(outputFile) && code === 0) {
    console.log(`\n🗑️  Cleaning up test output: ${outputFile}`);
    fs.unlinkSync(outputFile);
  }
});

ffmpeg.on('error', (err) => {
  clearInterval(memoryInterval);
  console.error('❌ FFmpeg process error:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Interrupted, killing ffmpeg...');
  ffmpeg.kill('SIGKILL');
  clearInterval(memoryInterval);
  process.exit(1);
}); 