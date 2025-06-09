import VideoUploader from "@/components/video-uploader"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">Video Remixer</h1>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
          Upload a short video (max 30 seconds) and get a remixed version
        </p>
        <VideoUploader />
      </div>
    </main>
  )
}
