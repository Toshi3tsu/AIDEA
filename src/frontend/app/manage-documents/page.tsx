// src/frontend/app/manage-documents/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import ManageDocuments from '../components/ManageDocuments';
import Chat from '../components/Chat';
import { MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import ReactDOM from 'react-dom/client';
import useProjectStore from '../store/projectStore';

export default function ManageDocumentsPage() {
  const { selectedProject } = useProjectStore();
  // 初期状態は収納（オフ）に設定
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    document.querySelector('.page-title')!.textContent = 'チェンジAI';
    const iconContainer = document.querySelector('.page-icon')!;
    iconContainer.innerHTML = '';
    const icon = document.createElement('div');
    const root = ReactDOM.createRoot(icon);
    root.render(<MessageSquare className="h-5 w-5" />);
    iconContainer.appendChild(icon);
  }, []);

  const togglePanel = () => {
    setIsExpanded((prev) => !prev);
  };

  // ボタンとロゴの共通サイズ（Tailwind CSSクラスで指定）
  const buttonSizeClass = "w-8 h-8";

  // 左にずらすオフセット（例: 20px）
  const offset = 15;

  return (
    <div className="relative flex h-full">
      {/* 左側: ドキュメント管理パネル */}
      <div
        className={`transition-all duration-300 ${isExpanded ? 'w-2/5 p-4' : 'w-0 p-0'} border-r overflow-hidden`}
      >
        <ManageDocuments selectedProject={selectedProject} />
      </div>

      {/* ロゴとトグルボタンをまとめたコンテナ */}
      <div
        className="absolute z-10 flex flex-col items-center transition-all duration-300"
        // ボタンと同様に、パネルの状態に応じて左位置を調整（展開時は40%の位置、収納時は0）
        style={{ left: isExpanded ? `calc(40% - ${offset}px)` : `-${offset}px`, top: '50%', transform: 'translateY(-50%)' }}
      >
        {/* ロゴの表示/非表示を isExpanded で制御 */}
        {!isExpanded && (
          <>
            {/* Slackロゴ */}
            <img
              src="/Slack_logo.png"
              alt="Slack Logo"
              className={`${buttonSizeClass} object-contain`}
            />
            {/* Boxロゴ */}
            <img
              src="/Box_logo.svg"
              alt="Box Logo"
              className={`${buttonSizeClass} object-contain mt-1`}
            />
          </>
        )}
        {/* トグルボタン */}
        <button
          onClick={togglePanel}
          className={`mt-6 ${buttonSizeClass} p-2 bg-[#173241] text-white hover:bg-[#0F2835] rounded-full shadow-md flex items-center justify-center transition-all duration-300`}
          title={isExpanded ? '収納' : '展開'}
        >
          {isExpanded ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* 右側: チャット */}
      <div className="flex-1 p-4">
        <Chat />
      </div>
    </div>
  );
}
