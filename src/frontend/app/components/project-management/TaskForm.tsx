// src/frontend/app/components/project-management/TaskForm.tsx
'use client';

import React, { useState } from 'react';
import { Task } from '../../project-management/page';

interface TaskFormProps {
  onTaskAdd: (newTask: Task) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onTaskAdd }) => {
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [detail, setDetail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assignee || !dueDate || !detail) {
      alert('すべての項目を入力してください。');
      return;
    }

    const newTask: Task = {
      title,
      assignee,
      start_date: new Date().toISOString().split('T')[0],
      due_date: dueDate,
      detail,
      tag: '', // 新規登録時はタグを空にする
    };
    onTaskAdd(newTask);
    // フォームをリセット
    setTitle('');
    setAssignee('');
    setDueDate('');
    setDetail('');
    alert('タスクを登録しました。');
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">タスク登録</h2>
      <form onSubmit={handleSubmit} className="border p-4 rounded space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            タイトル
          </label>
          <input
            type="text"
            id="title"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="assignee" className="block text-sm font-medium text-gray-700">
            担当者
          </label>
          <input
            type="text"
            id="assignee"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
            期限
          </label>
          <input
            type="date"
            id="dueDate"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="detail" className="block text-sm font-medium text-gray-700">
            詳細
          </label>
          <textarea
            id="detail"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#BF4242] hover:bg-[#A53939] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#BF4242]"
          >
            登録
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;