'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PanelAdminPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to overview page
    router.replace('/admin/panel/overview')
  }, [router])

  return (
    <div className="p-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}
