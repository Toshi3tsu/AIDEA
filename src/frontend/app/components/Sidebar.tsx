// src/frontend/app/components/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Home, Settings, Layers, Lightbulb, FileText, ChartGantt, Key } from 'lucide-react'
import useProjectStore from '../store/projectStore';
import axios from 'axios';

export default function Sidebar() {
  const pathname = usePathname()
  const defaultApiKey = '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'
  const [apiKey, setApiKey] = useState(defaultApiKey)
  const { projects, selectedProject, setProjects, setSelectedProject } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, []);

  // APIキーを保存
  const handleSaveApiKey = () => {
    localStorage.setItem('apiKey', apiKey)
    alert('APIキーが保存されました！')
  }

  const fetchProjects = async () => {
    try {
      const response = await axios.get<Project[]>('http://127.0.0.1:8000/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('プロジェクトの取得に失敗しました。');
    }
  };

  const handleProjectSelect = (projectId: number) => {
    const project = projects.find((p) => p.id === projectId)
    setSelectedProject(project || null)
  }

  const isActive = (path: string) => pathname === path

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      {/* サイドバーヘッダー */}
      <div className="px-4 py-2 border-b">
        <img src="/logo.png" alt="Logo" className="w-36 h-auto mx-auto" />
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-4 py-4">
      <Link
        href="/"
        className={`flex items-center px-4 py-2 text-gray-700 ${
          isActive('/') ? 'bg-gray-200 font-bold' : ''
        }`}
        aria-current={isActive('/') ? 'page' : undefined}
      >
        <Home className="mr-2 h-5 w-5" />
        ホーム
      </Link>
      <Link
        href="/manage-documents"
        className={`flex items-center px-4 py-2 mt-2 text-gray-700 ${
          isActive('/manage-documents') ? 'bg-gray-200 font-bold' : ''
        }`}
        aria-current={isActive('/manage-documents') ? 'page' : undefined}
      >
        <FileText className="mr-2 h-5 w-5" />
        ドキュメント管理
      </Link>
      <Link
        href="/project-management"
        className={`flex items-center px-4 py-2 mt-2 text-gray-700 ${
          isActive('/project-management') ? 'bg-gray-200 font-bold' : ''
        }`}
        aria-current={isActive('/project-management') ? 'page' : undefined}
      >
        <ChartGantt className="mr-2 h-5 w-5" />
        プロジェクト管理
      </Link>
      <Link
        href="/generate"
        className={`flex items-center px-4 py-2 mt-2 text-gray-700 ${
          isActive('/generate') ? 'bg-gray-200 font-bold' : ''
        }`}
        aria-current={isActive('/generate') ? 'page' : undefined}
      >
        <Lightbulb className="mr-2 h-5 w-5" />
        コンサルティングAI
      </Link>
      <Link
        href="/settings"
        className={`flex items-center px-4 py-2 mt-2 text-gray-700 ${
          isActive('/settings') ? 'bg-gray-200 font-bold' : ''
        }`}
        aria-current={isActive('/settings') ? 'page' : undefined}
      >
        <Settings className="mr-2 h-5 w-5" />
        設定
      </Link>
      <hr className="my-4 border-gray-300" />

        {/* プロジェクト選択 */}
        <div className="px-2">
          <h3 className="text-md font-semibold mb-2">プロジェクト選択</h3>
          <ul className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
            {projects.length > 0 ? (
              projects.map((project) => (
                <li
                  key={project.id}
                  className={`cursor-pointer p-2 text-sm rounded-lg hover:bg-gray-100 ${
                    selectedProject?.id === project.id ? 'bg-gray-200 font-bold' : ''
                  }`}
                  onClick={() => handleProjectSelect(project.id)}
                >
                  {project.customer_name}
                </li>
              ))
            ) : (
              <p className="text-sm text-gray-500">プロジェクトがありません</p>
            )}
          </ul>
        </div>
      </nav>

      <div className="px-4 py-4 border-t">
        <Link
          href="/product-management"
          className={`flex items-center px-4 py-2 mt-4 text-gray-700 ${
            isActive('/product-management') ? 'bg-gray-200 font-bold' : ''
          }`}
          aria-current={isActive('/product-management') ? 'page' : undefined}
        >
          <Layers className="mr-2 h-5 w-5" />
          プロダクト管理
        </Link>
      </div>

      <div className="px-4 py-4 border-t">
        <input
          type="password"
          placeholder="Enter API Key"
          className="w-full px-3 py-2 border rounded"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <button
          onClick={handleSaveApiKey}
          className="mt-2 w-full bg-[#173241] text-white px-4 py-2 rounded flex items-center justify-center"
        >
          <Key className="mr-2 h-4 w-4" />
          Save API Key
        </button>
      </div>
    </div>
  )
}