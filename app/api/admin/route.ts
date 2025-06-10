import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const GENERATED_DIR = path.join(process.cwd(), 'config', 'generated');
const LOGS_DIR = path.join(process.cwd(), 'logs');

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  
  try {
    if (action === 'configs') {
      // List all job configs
      const files = await fs.readdir(GENERATED_DIR);
      const configs = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const configPath = path.join(GENERATED_DIR, file);
          const configData = await fs.readFile(configPath, 'utf-8');
          const config = JSON.parse(configData);
          configs.push({
            filename: file,
            ...config,
            timestamp: file.split('_')[0] // Extract timestamp from filename
          });
        }
      }
      
      // Sort by timestamp (newest first)
      configs.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      
      return NextResponse.json({ configs });
    }
    
    if (action === 'logs') {
      // List recent log files
      const files = await fs.readdir(LOGS_DIR);
      const logFiles = files.filter(f => f.endsWith('.log'));
      
      if (logFiles.length === 0) {
        return NextResponse.json({ logs: 'No logs found' });
      }
      
      // Get the most recent log file
      const latestLog = logFiles.sort().pop();
      const logPath = path.join(LOGS_DIR, latestLog!);
      const logContent = await fs.readFile(logPath, 'utf-8');
      
      return NextResponse.json({ 
        latestLog,
        content: logContent.split('\n').slice(-100).join('\n') // Last 100 lines
      });
    }
    
    return NextResponse.json({ 
      message: 'Admin API - use ?action=configs or ?action=logs' 
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
} 