// src/frontend/app/components/project-management/TaskForm.tsx
'use client';

import React, { useState } from 'react';
import { Task } from '../../../src/types/document';
import useProjectStore from '../../store/projectStore';
import axios from 'axios';

interface TaskFormProps {
  onTaskAdd: (newTask: Task) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onTaskAdd }) => {
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [startDate, setStartDate] = useState(''); // 開始日を追加
  const [dueDate, setDueDate] = useState('');
  const [detail, setDetail] = useState('');
  const { selectedProject } = useProjectStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assignee || !startDate || !dueDate || !detail) {
      alert('すべての項目を入力してください。');
      return;
    }
  
    if (!selectedProject) {
      alert('プロジェクトを選択してください。');
      return;
    }
  
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/project_tasks/', {
        project_id: selectedProject.id,
        user_id: 'user_888',
        title,
        assignee,
        start_date: startDate,
        due_date: dueDate,
        detail,
        tag: '',
      });
  
      if (response.status === 200) {
        const newTask: Task = {
          title,
          assignee,
          start_date: startDate,
          due_date: dueDate,
          detail,
          tag: '', // 必要に応じて適切なタグを設定
        };
        onTaskAdd(newTask); // 新しいタスクをonTaskAddに渡す
  
        // フォームをリセット
        setTitle('');
        setAssignee('');
        setStartDate('');
        setDueDate('');
        setDetail('');
        alert('タスクを登録しました。');
      } else {
        alert('タスク登録に失敗しました。');
      }
    } catch (error) {
      console.error('タスク登録エラー:', error);
      alert('タスク登録中にエラーが発生しました。');
    }
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
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            開始日
          </label>
          <input
            type="date"
            id="startDate"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
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
