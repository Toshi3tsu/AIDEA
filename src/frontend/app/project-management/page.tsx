// src/frontend/app/project-management/page.tsx
'use client';

import React from 'react';
import useProjectStore from '../store/projectStore';

interface Task {
  title: string;
  assignee: string;
  due_date: string;
  detail: string;
  tag: '新規作成' | '更新' | 'クローズ' | '無視';
}

export default function ProjectManagement() {
  const { extractedTasks } = useProjectStore();

  // ダミーの現在のタスクデータ
  const currentTasks: Task[] = [
    { title: "既存タスクA", assignee: "山田", due_date: "2025-02-01", detail: "詳細A", tag: "更新" },
    { title: "既存タスクB", assignee: "鈴木", due_date: "2025-02-15", detail: "詳細B", tag: "クローズ" }
  ];

  const handleLinkTasks = async () => {
    // Backlog連携処理を行うコード
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">プロジェクト管理 Powered by Planner</h1>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">抽出されたタスク</h2>
          <ul className="border p-2 rounded">
            {extractedTasks.map((task, index) => (
              <li key={index} className="mb-2 border-b pb-1">
                <div className="font-medium">{task.title}</div>
                <div>担当: {task.assignee}</div>
                <div>期限: {task.due_date}</div>
                <div>詳細: {task.detail}</div>
                <div>タグ: {task.tag}</div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">現在のタスク</h2>
          <ul className="border p-2 rounded">
            {currentTasks.map((task, index) => (
              <li key={index} className="mb-2 border-b pb-1">
                <div className="font-medium">{task.title}</div>
                <div>担当: {task.assignee}</div>
                <div>期限: {task.due_date}</div>
                <div>詳細: {task.detail}</div>
                <div>タグ: {task.tag}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button
        onClick={handleLinkTasks}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        タスクの紐づけを行う
      </button>
    </div>
  );
}
