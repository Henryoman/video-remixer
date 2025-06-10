import fs from 'fs/promises';
import path from 'path';

const LOGS_DIR = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
async function ensureLogsDir() {
  try {
    await fs.mkdir(LOGS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore error
  }
}

// Create a timestamped log file name
function getLogFileName() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `video-remixer-${timestamp}.log`;
}

let logFileName: string | null = null;

export async function log(message: string) {
  // Print to console (existing behavior)
  console.log(message);
  
  try {
    // Ensure logs directory exists
    await ensureLogsDir();
    
    // Create log file name if not set
    if (!logFileName) {
      logFileName = getLogFileName();
    }
    
    // Write to log file
    const logPath = path.join(LOGS_DIR, logFileName);
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    await fs.appendFile(logPath, logEntry);
  } catch (error) {
    // If logging fails, just continue (don't break the app)
    console.error('Failed to write to log file:', error);
  }
} 