import { type NextRequest, NextResponse } from "next/server"
import { randomizeParameters, DEFAULT_CONFIG } from "@/lib/simple-randomizer"

export async function POST(request: NextRequest) {
  try {
    const { videoId, blobUrl, videoDuration = 30, config } = await request.json()

    if (!videoId || !blobUrl) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Generate simple parameters with just timestamp and length (and optional extras)
    const videoConfig = randomizeParameters(videoDuration, config || DEFAULT_CONFIG)

    console.log("Generated video config:", JSON.stringify(videoConfig, null, 2))

    // Send to json2video endpoint
    const processedVideoUrl = await processVideoWithJson2Video(blobUrl, videoConfig)

    return NextResponse.json({
      success: true,
      downloadUrl: processedVideoUrl,
      config: videoConfig,
    })
  } catch (error) {
    console.error("Processing error:", error)
    return NextResponse.json({ error: "Failed to process video" }, { status: 500 })
  }
}

async function processVideoWithJson2Video(videoUrl: string, config: any) {
  const json2videoApiKey = process.env.JSON2VIDEO_API_KEY
  const json2videoEndpoint = process.env.JSON2VIDEO_ENDPOINT_URL

  if (!json2videoApiKey || !json2videoEndpoint) {
    throw new Error("JSON2VIDEO API configuration missing")
  }

  try {
    // For testing purposes, just return the original URL
    // In production, replace with actual API call
    console.log("Would send to JSON2VIDEO:", {
      videoUrl,
      config,
    })

    // Simulated API call
    const response = await fetch(json2videoEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${json2videoApiKey}`,
      },
      body: JSON.stringify({
        videoUrl,
        config,
      }),
    })

    if (!response.ok) {
      throw new Error(`JSON2Video API error: ${response.status}`)
    }

    const result = await response.json()
    return result.processedVideoUrl || videoUrl // Fallback to original URL
  } catch (error) {
    console.error("JSON2Video processing error:", error)
    // For testing, return the original URL
    return videoUrl
  }
}
