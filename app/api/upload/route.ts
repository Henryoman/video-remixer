import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("video") as File

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`videos/${Date.now()}-${file.name}`, file, {
      access: "public",
      multipart: true,
    })

    // Generate a unique ID for this video
    const videoId = `video_${Date.now()}`

    return NextResponse.json({
      success: true,
      blobUrl: blob.url,
      videoId,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload video" }, { status: 500 })
  }
}
