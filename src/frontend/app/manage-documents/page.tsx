// src/frontend/app/manage-documents/page.tsx
'use client';

import React, { useEffect } from 'react';
import ManageDocuments from '../components/ManageDocuments';
import Chat from '../components/Chat';
import { MessageSquare } from 'lucide-react';
import ReactDOM from 'react-dom/client';
import useProjectStore from '../store/projectStore';

export default function ManageDocumentsPage() {
  const { selectedProject } = useProjectStore();
  useEffect(() => {
    document.querySelector('.page-title')!.textContent = 'チェンジAI';
    const iconContainer = document.querySelector('.page-icon')!;
    iconContainer.innerHTML = '';
    const icon = document.createElement('div');
    const root = ReactDOM.createRoot(icon); // root を作成
    root.render(<MessageSquare className="h-5 w-5" />); // root の render メソッドを使用
    iconContainer.appendChild(icon);
  }, []);
  return (
    <div className="flex h-full">
      {/* 左側: ドキュメント管理 */}
      <div className="w-2/5 p-4 border-r">
        <ManageDocuments selectedProject={selectedProject} />
      </div>

      {/* 右側: チャット */}
      <div className="w-3/5 p-4">
        <Chat />
      </div>
    </div>
  );
}
