// src/frontend/app/components/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Home, Settings, PlusCircle, Save } from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const defaultApiKey = ''
  const [apiKey, setApiKey] = useState(defaultApiKey)

  const isActive = (path: string) => pathname === path

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      {/* サイドバーヘッダー */}
      <div className="px-4 py-2 border-b">
        <img src="/logo.png" alt="Logo" className="w-32 h-auto mx-auto" />
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-2 py-4">
        <Link href="/" className={`flex items-center px-4 py-2 text-gray-700 ${isActive('/') ? 'bg-gray-200' : ''}`}>
          <Home className="mr-3 h-5 w-5" />
          Dashboard
        </Link>
        <Link href="/generate" className={`flex items-center px-4 py-2 mt-2 text-gray-700 ${isActive('/generate') ? 'bg-gray-200' : ''}`}>
          <PlusCircle className="mr-3 h-5 w-5" />
          Generate
        </Link>
        <Link href="/settings" className={`flex items-center px-4 py-2 mt-2 text-gray-700 ${isActive('/settings') ? 'bg-gray-200' : ''}`}>
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </Link>
      </nav>
      <div className="px-4 py-4 border-t">
        <input
          type="password"
          placeholder="Enter API Key"
          className="w-full px-3 py-2 border rounded"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <button className="mt-2 w-full bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center">
          <Save className="mr-2 h-4 w-4" />
          Save API Key
        </button>
      </div>
    </div>
  )
}
