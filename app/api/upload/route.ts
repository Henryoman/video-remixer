import { type NextRequest, NextResponse } from "next/server"
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("video") as File

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 })
    }

    // Generate a unique ID for this video
    const videoId = `video_${Date.now()}`;
    
    // Save to local uploads directory with videoId name
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    const fileName = `${videoId}.mp4`;
    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      filePath,
      videoId,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload video" }, { status: 500 })
  }
}
