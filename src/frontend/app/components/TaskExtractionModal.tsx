// src/frontend/app/components/TaskExtractionModal.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import useProjectStore from '../store/projectStore';

interface Task {
  title: string;
  tag: '新規作成' | '更新' | 'クローズ' | '無視';
  assignee: string;  // 担当者名
  due_date: string;  // 期限
  detail: string;    // 詳細
}

interface TaskExtractionModalProps {
  documentText: string;
  extractedTasks: Task[];
  onCancel: () => void;
}

const TaskExtractionModal: React.FC<TaskExtractionModalProps> = ({
  documentText,
  extractedTasks,
  onCancel
}) => {
  const [tasks, setTasks] = useState<Task[]>(extractedTasks);
  const { setExtractedTasks } = useProjectStore();
  const router = useRouter();

  // タグの変更などを行う関数を実装
  const handleTagChange = (index: number, newTag: Task['tag']) => {
    const updatedTasks = [...tasks];
    updatedTasks[index].tag = newTag;
    setTasks(updatedTasks);
  };

  const handleTaskLink = () => {
    setExtractedTasks(tasks);
    router.push('/project-management');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-7xl w-11/12 relative">
        {/* 右上の中止ボタン */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 px-2 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
        >
          中止
        </button>

        <h2 className="text-xl font-bold mb-4 text-center">タスク抽出結果の確認</h2>
        <div className="flex space-x-4 mb-4">
          {/* 左側: 元のドキュメント */}
          <div className="flex-1 flex flex-col">
            <h3 className="font-semibold mb-2">元のドキュメント</h3>
            <div className="w-full h-[600px] p-2 border border-gray-300 rounded overflow-auto whitespace-pre-wrap">
              {documentText}
            </div>
          </div>
          {/* 右側: 抽出されたタスク */}
          <div className="flex-1 flex flex-col">
            <h3 className="font-semibold mb-2">抽出されたタスク</h3>
            <div className="w-full h-[500px] p-2 border border-gray-300 rounded overflow-auto">
              {tasks.map((task, index) => (
                <div key={index} className="mb-2 p-2 border-b">
                  <div className="font-medium">{task.title}</div>
                  {/* タグの選択肢（例としてセレクトボックスを使用） */}
                  <select
                    value={task.tag}
                    onChange={(e) => handleTagChange(index, e.target.value as Task['tag'])}
                    className="mt-1 p-1 border rounded"
                  >
                    <option value="新規作成">新規作成</option>
                    <option value="更新">更新</option>
                    <option value="クローズ">クローズ</option>
                    <option value="無視">無視</option>
                  </select>
                </div>
              ))}
            </div>
            {/* タスクの紐づけボタン */}
            <button
              className="mt-4 px-4 py-2 bg-[#173241] text-white rounded hover:bg-[#0F2835]"
              onClick={handleTaskLink}
            >
              タスクの紐づけ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskExtractionModal;
