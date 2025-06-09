import { type NextRequest, NextResponse } from "next/server"
import { randomizeJob } from "@/scripts/randomize"
import { applyEdits } from "@/scripts/applyEdits"
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: "Missing videoId" }, { status: 400 })
    }

    // Get the input file path
    const inputFile = path.join(process.cwd(), 'uploads', `${videoId}.mp4`)

    // Generate randomized job config
    const jobId = await randomizeJob(inputFile)

    // Apply the edits to generate output video
    const outputFile = await applyEdits(jobId)

    return NextResponse.json({
      success: true,
      jobId,
      downloadUrl: `/api/download?jobId=${jobId}`,
    })
  } catch (error) {
    console.error("Processing error:", error)
    return NextResponse.json({ error: "Failed to process video" }, { status: 500 })
  }
}
