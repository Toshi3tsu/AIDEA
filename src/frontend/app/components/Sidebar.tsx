// src/frontend/app/components/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Home, Settings, Layers, FileText, ChartGantt, BotMessageSquare, Key, ChevronLeft, ChevronRight, Presentation } from 'lucide-react'
import useProjectStore from '../store/projectStore';
import axios from 'axios';

export default function Sidebar() {
  const pathname = usePathname()
  const defaultApiKey = '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'
  const [apiKey, setApiKey] = useState(defaultApiKey)
  const { projects, selectedProject, setProjects, setSelectedProject } = useProjectStore();
  const [isCollapsed, setIsCollapsed] = useState(true);

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

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`bg-white shadow-lg flex flex-col h-screen overflow-y-auto ${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300`}>
      {/* サイドバーヘッダー */}
      <div className="px-4 py-2 border-b flex items-center justify-between">
        <img
          src={isCollapsed ? "/favicon.ico" : "/logo.png"}
          alt="Logo"
          className={`h-auto transition-all duration-300 ${isCollapsed ? 'w-10' : 'w-36'}`}
        />
        <button
          onClick={toggleCollapse}
          className="p-1 rounded-full hover:bg-gray-200"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-2 py-2">
      <Link
        href="/"
        className={`flex items-center px-4 py-2 text-gray-700 ${
          isActive('/') ? 'bg-gray-200 font-bold' : ''
        } ${isCollapsed ? 'justify-center' : ''}`} // isCollapsed で justify-center を追加
        aria-current={isActive('/') ? 'page' : undefined}
      >
        <Home className={`mr-2 h-5 w-5 ${isCollapsed ? 'mr-0' : 'mr-2'}`} /> {/* isCollapsed で mr を調整 */}
        <span className={`${isCollapsed ? 'hidden' : 'inline'}`}>ホーム</span> {/* isCollapsed でテキスト表示/非表示を切り替え */}
      </Link>
      <Link
        href="/manage-documents"
        className={`flex items-center px-4 py-2 mt-2 text-gray-700 ${
          isActive('/manage-documents') ? 'bg-gray-200 font-bold' : ''
        } ${isCollapsed ? 'justify-center' : ''}`} // isCollapsed で justify-center を追加
        aria-current={isActive('/manage-documents') ? 'page' : undefined}
      >
        <BotMessageSquare className={`mr-2 h-5 w-5 ${isCollapsed ? 'mr-0' : 'mr-2'}`} /> {/* isCollapsed で mr を調整 */}
        <span className={`${isCollapsed ? 'hidden' : 'inline'}`}>チェンジAI</span> {/* isCollapsed でテキスト表示/非表示を切り替え */}
      </Link>
      <Link
        href="/project-management"
        className={`flex items-center px-4 py-2 mt-2 text-gray-700 ${
          isActive('/project-management') ? 'bg-gray-200 font-bold' : ''
        } ${isCollapsed ? 'justify-center' : ''}`} // isCollapsed で justify-center を追加
        aria-current={isActive('/project-management') ? 'page' : undefined}
      >
        <ChartGantt className={`mr-2 h-5 w-5 ${isCollapsed ? 'mr-0' : 'mr-2'}`} /> {/* isCollapsed で mr を調整 */}
        <span className={`${isCollapsed ? 'hidden' : 'inline'}`}>プロジェクト管理AI</span> {/* isCollapsed でテキスト表示/非表示を切り替え */}
      </Link>
      {/* リサーチAI リンクを追加 */}
      <Link
        href="/research-ai"
        className={`flex items-center px-4 py-2 mt-2 text-gray-700 ${
          isActive('/research-ai') ? 'bg-gray-200 font-bold' : ''
        } ${isCollapsed ? 'justify-center' : ''}`} // isCollapsed で justify-center を追加
        aria-current={isActive('/research-ai') ? 'page' : undefined}
      >
        <FileText className={`mr-2 h-5 w-5 ${isCollapsed ? 'mr-0' : 'mr-2'}`} /> {/* isCollapsed で mr を調整 */}
        <span className={`${isCollapsed ? 'hidden' : 'inline'}`}>ドキュメント作成AI</span> {/* isCollapsed でテキスト表示/非表示を切り替え */}
      </Link>
      <Link
        href="/generate"
        className={`flex items-center px-4 py-2 mt-2 text-gray-700 ${
          isActive('/generate') ? 'bg-gray-200 font-bold' : ''
        } ${isCollapsed ? 'justify-center' : ''}`} // isCollapsed で justify-center を追加
        aria-current={isActive('/generate') ? 'page' : undefined}
      >
        <Presentation className={`mr-2 h-5 w-5 ${isCollapsed ? 'mr-0' : 'mr-2'}`} /> {/* isCollapsed で mr を調整 */}
        <span className={`${isCollapsed ? 'hidden' : 'inline'}`}>スライド作成AI</span> {/* isCollapsed でテキスト表示/非表示を切り替え */}
      </Link>
      <Link
        href="/settings"
        className={`flex items-center px-4 py-2 mt-2 text-gray-700 ${
          isActive('/settings') ? 'bg-gray-200 font-bold' : ''
        } ${isCollapsed ? 'justify-center' : ''}`} // isCollapsed で justify-center を追加
        aria-current={isActive('/settings') ? 'page' : undefined}
      >
        <Settings className={`mr-2 h-5 w-5 ${isCollapsed ? 'mr-0' : 'mr-2'}`} /> {/* isCollapsed で mr を調整 */}
        <span className={`${isCollapsed ? 'hidden' : 'inline'}`}>設定</span> {/* isCollapsed でテキスト表示/非表示を切り替え */}
      </Link>
      <hr className="my-4 border-gray-300" />
      </nav>

      <div className="px-2 py-2 border-t">
        <Link
          href="/product-management"
          className={`flex items-center px-4 py-2 mt-2 text-gray-700 ${
            isActive('/product-management') ? 'bg-gray-200 font-bold' : ''
          } ${isCollapsed ? 'justify-center' : ''}`} // isCollapsed で justify-center を追加
          aria-current={isActive('/product-management') ? 'page' : undefined}
        >
          <Layers className={`h-5 w-5 ${isCollapsed ? 'mr-0' : 'mr-2'}`} /> {/* isCollapsed で mr を調整 */}
          <span className={`${isCollapsed ? 'hidden' : 'inline'}`}>プロダクト管理</span> {/* isCollapsed でテキスト表示/非表示を切り替え */}
        </Link>
      </div>

      <div className="px-2 py-2 border-t">
        <input
          type="password"
          placeholder="Enter API Key"
          className={`w-full px-3 py-2 border rounded ${isCollapsed ? 'hidden' : 'block'}`} // isCollapsed で API Key 入力欄を非表示
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <button
          onClick={handleSaveApiKey}
          className={`mt-2 w-full bg-[#173241] text-white px-4 py-2 rounded flex items-center justify-center ${isCollapsed ? 'hidden' : 'flex'}`} // isCollapsed で API Key 保存ボタンを非表示
        >
          <Key className="mr-2 h-4 w-4" />
          <span className={`${isCollapsed ? 'hidden' : 'inline'}`}>Save API Key</span> {/* isCollapsed でテキスト表示/非表示を切り替え */}
        </button>
      </div>
    </div>
  )
}