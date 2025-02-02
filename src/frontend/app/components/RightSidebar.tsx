// src/frontend/app/components/RightSidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import useProjectStore from '../store/projectStore';
import useChatStore from '../store/chatStore';
import axios from 'axios';

interface ChatRecord {
  sender: string;
  message: string;
  timestamp: string;
}

interface Props {
  selectedModel: { value: string; label: string };
  selectedProject: any;
}

export default function RightSidebar({ selectedModel, selectedProject }: Props) {
  const { projects, sessionTitles, setSessionTitles, setSelectedSession, } = useProjectStore();
  const { resetMessages, addMessage } = useChatStore();
  const [selectedSessionLocal, setSelectedSessionLocal] = useState<string | null>(null);
  const [openDropdownSession, setOpenDropdownSession] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProject) {
      fetchSessionTitles(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchSessionTitles = async (projectId: number) => {
    try {
      const response = await axios.get<string[]>(`http://127.0.0.1:8000/api/chat_history/sessions/${projectId}`);
      setSessionTitles(response.data);
    } catch (error) {
      console.error('Error fetching session titles:', error);
    }
  };

  const toggleDropdown = (title: string) => {
    setOpenDropdownSession(prev => (prev === title ? null : title));
  };

  const handleSessionSelect = async (sessionTitle: string) => {
    setSelectedSessionLocal(sessionTitle);
    setSelectedSession(sessionTitle);
    resetMessages();
    try {
      const response = await axios.get<ChatRecord[]>(`http://127.0.0.1:8000/api/chat_history/history/${selectedProject?.id}/${sessionTitle}`, {
        params: { model: selectedModel.value }
      });
      response.data.forEach(record => {
        addMessage({ sender: record.sender as 'user' | 'ai', message: record.message });
      });
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleRenameSession = async (sessionTitle: string) => {
    const newTitle = prompt('新しいセッション名を入力してください:', sessionTitle);
    if (!newTitle) return;
    try {
      await axios.put('http://127.0.0.1:8000/api/chat_history/rename', null, {
        params: {
          project_id: selectedProject?.id,
          old_title: sessionTitle,
          new_title: newTitle,
        },
      });
      fetchSessionTitles(selectedProject!.id);
    } catch (error) {
      console.error('Error renaming session:', error);
    }
  };
  
  const handleDeleteSession = async (sessionTitle: string) => {
    if (!confirm('このセッションを削除してもよろしいですか？')) return;
    try {
      await axios.delete('http://127.0.0.1:8000/api/chat_history/delete', {
        params: {
          project_id: selectedProject?.id,
          session_title: sessionTitle,
        },
      });
      fetchSessionTitles(selectedProject!.id);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };
  
  const handleMoveProject = async (sessionTitle: string) => {
    const newProjectIdStr = prompt('新しいプロジェクトIDを入力してください:');
    if (!newProjectIdStr) return;
    const newProjectId = parseInt(newProjectIdStr, 10);
    if (isNaN(newProjectId)) {
      alert('有効なプロジェクトIDを入力してください。');
      return;
    }
    try {
      await axios.put('http://127.0.0.1:8000/api/chat_history/move', null, {
        params: {
          old_project_id: selectedProject?.id,
          new_project_id: newProjectId,
          session_title: sessionTitle,
        },
      });
      alert('セッションのプロジェクト移動が完了しました。');
    } catch (error) {
      console.error('Error moving session:', error);
    }
  };

  return (
    <div className="w-64 bg-gray-50 shadow-lg flex flex-col p-4 overflow-y-auto">
      {/* サイドバーヘッダー */}
      <div className="flex items-center justify-between border-b pb-4 mb-4">
        <h2 className="text-lg font-bold">チャット設定</h2>
        <Info className="h-5 w-5 text-gray-600" />
      </div>

      {/* チャット履歴表示・選択セクション */}
      <div className="mb-4">
        <h3 className="text-md font-semibold mb-2">チャット履歴</h3>
        {selectedProject ? (
          <ul className="max-h-180 overflow-y-auto border border-gray-200 rounded p-1">
            {sessionTitles && sessionTitles.length > 0 ? (
              sessionTitles.map((title) => (
                <li
                  key={title}
                  className={`relative cursor-pointer p-1 hover:bg-gray-100 ${selectedSessionLocal === title ? 'bg-gray-200' : ''}`}
                >
                  <div className="flex items-center justify-between" onClick={() => handleSessionSelect(title)}>
                    <span className="text-sm truncate">{title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(title);
                      }}
                      className="ml-2 text-gray-500 hover:text-gray-700 text-sm p-1"
                    >
                      ⋮
                    </button>
                  </div>
                  {openDropdownSession === title && (
                    <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded shadow-lg z-10">
                      <button
                        className="block w-full text-left text-sm px-2 py-1 hover:bg-gray-100"
                        onClick={() => handleMoveProject(title)}
                      >
                        プロジェクトの移動
                      </button>
                      <button
                        className="block w-full text-left text-sm px-2 py-1 hover:bg-gray-100"
                        onClick={() => handleRenameSession(title)}
                      >
                        セッション名称変更
                      </button>
                      <button
                        className="block w-full text-left text-sm px-2 py-1 hover:bg-gray-100"
                        onClick={() => handleDeleteSession(title)}
                      >
                        セッション削除
                      </button>
                    </div>
                  )}
                </li>
              ))
            ) : (
              <p className="text-gray-500 text-sm">履歴がありません</p>
            )}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">プロジェクトを選択してください</p>
        )}
      </div>
    </div>
  );
}