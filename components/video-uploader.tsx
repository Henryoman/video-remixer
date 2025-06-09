"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Progress from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function VideoUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [processingVideo, setProcessingVideo] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    setError(null)

    if (!selectedFile) {
      return
    }

    // Check if it's a video
    if (!selectedFile.type.startsWith("video/")) {
      setError("Please upload a video file")
      return
    }

    // Create a temporary URL to check video duration
    const videoElement = document.createElement("video")
    videoElement.preload = "metadata"

    videoElement.onloadedmetadata = () => {
      URL.revokeObjectURL(videoElement.src)

      // Check duration (max 30 seconds)
      if (videoElement.duration > 30) {
        setError("Video must be 30 seconds or less")
        return
      }

      setFile(selectedFile)
    }

    videoElement.src = URL.createObjectURL(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append("video", file)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + 5
        })
      }, 200)

      // Upload the video
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload video")
      }

      const { videoId } = await uploadResponse.json()

      // Process the video
      setIsUploading(false)
      setProcessingVideo(true)

      const processResponse = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId }),
      })

      if (!processResponse.ok) {
        throw new Error("Failed to process video")
      }

      const { downloadUrl } = await processResponse.json()
      setDownloadUrl(downloadUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsUploading(false)
      setProcessingVideo(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setDownloadUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      {!downloadUrl ? (
        <>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {file ? (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  className="mx-auto max-h-[400px] rounded-lg"
                  src={URL.createObjectURL(file)}
                  controls
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-10">
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Drag and drop your video here or click to browse
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Max 30 seconds, 9:16 aspect ratio recommended
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="video-upload"
                />
                <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                  Select Video
                </Button>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-center text-gray-500 dark:text-gray-400">Uploading: {uploadProgress}%</p>
            </div>
          )}

          {processingVideo && (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Processing your video...</p>
            </div>
          )}

          <div className="flex space-x-2">
            {file && (
              <Button variant="outline" className="flex-1" onClick={resetForm}>
                Cancel
              </Button>
            )}
            <Button className="flex-1" onClick={handleUpload} disabled={!file || isUploading || processingVideo}>
              {isUploading ? "Uploading..." : processingVideo ? "Processing..." : "Remix Video"}
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-4 text-center">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">Your video is ready!</h3>
            <p className="text-sm text-green-600 dark:text-green-400">
              Your remixed video has been created successfully.
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            <Button asChild>
              <a href={downloadUrl} download="remixed-video.mp4">
                Download Remixed Video
              </a>
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Remix Another Video
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
