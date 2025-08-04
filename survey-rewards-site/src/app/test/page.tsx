'use client'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">
          🎯 THIS IS EARNLY TEST PAGE 🎯
        </h1>
        <p className="text-2xl text-white mb-4">
          If you see this, you're on the RIGHT server!
        </p>
        <p className="text-xl text-white">
          Port 3005 - Earnly Survey Rewards Site
        </p>
        <div className="mt-8 p-4 bg-white rounded-lg">
          <p className="text-black text-lg font-bold">
            Current Time: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
