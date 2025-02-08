// src/frontend/app/layout.tsx
"use client";

import Sidebar from './components/Sidebar';
import { Home } from 'lucide-react';
import ProjectSelector from './components/ProjectSelector';
import RightSidebar from './components/RightSidebar'
import Select from 'react-select';
import { useModelStore } from './store/modelStore';
import useProjectStore from './store/projectStore';
import { Inter } from 'next/font/google';
import './globals.css';
import { usePathname } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] });

interface ModelOption {
  value: string;
  label: string;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { maskingEnabled, setMaskingEnabled, selectedProject } = useProjectStore();
  const { selectedModel, setSelectedModel } = useModelStore();
  const pathname = usePathname(); // 現在のパス名を取得
  const isProjectManagementPage = pathname === '/project-management'; // パス名が /project-management かどうか

  const modelOptions: ModelOption[] = [
    { value: 'Azure-gpt-4o-mini', label: 'Azure_GPT-4o-mini' },
    { value: 'gpt-4o-mini', label: 'GPT-4o-mini' },
    { value: 'deepseek-chat', label: 'DeepSeek v3' },
  ];

  return (
    <html lang="ja" className={inter.className}>
      <head>
        <link rel="icon" href="/favicon.ico?v=2" />
      </head>
      <body>
        <div className="flex h-screen bg-gray-100">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-y-auto">
            <header className="py-2 px-4 sticky top-0 z-10 shadow-md flex items-center justify-between">
              <div className="flex items-center">
                <span className="page-icon mr-2">
                  <Home className="h-5 w-5" />
                </span>
                <h1 className="text-xl page-title">Page Title</h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <ProjectSelector />
                </div>
                <div className="flex items-center">
                  <span className="mr-2">モデル選択：</span>
                  <Select
                    options={modelOptions}
                    value={selectedModel}
                    onChange={(option) => option && setSelectedModel(option)}
                    className="w-40"
                  />
                </div>
                {/* <div className="flex items-center">
                  <span className="mr-2">個人・機密情報マスキング：</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={maskingEnabled}
                      onChange={() => setMaskingEnabled(!maskingEnabled)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#CB6CE6]"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">{maskingEnabled ? '有効' : '無効'}</span>
                  </label>
                </div> */}
              </div>
            </header>
            <main className={`flex-1 overflow-y-auto p-6 ${isProjectManagementPage ? 'h-full' : ''}`}> {/* isProjectManagementPage が true の場合のみ h-full を適用 */}
              {children}
            </main>
          </div>
          {/* <RightSidebar selectedModel={selectedModel} selectedProject={selectedProject} /> */}
        </div>
      </body>
    </html>
  );
}