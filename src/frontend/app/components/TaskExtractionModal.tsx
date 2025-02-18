// src/frontend/app/components/TaskExtractionModal.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import useProjectStore from '../store/projectStore';
import { Trash2 } from 'lucide-react';

interface Task {
  title: string;
  tag: '' | '新規作成' | '更新' | 'クローズ' | '無視';
  assignee: string;
  start_date: string; // YYYY-MM-DD形式を想定
  due_date: string; // YYYY-MM-DD形式を想定
  detail: string;
}

interface TaskExtractionModalProps {
  documentText: string;
  extractedTasks: Task[];
  onCancel: () => void;
}

const TaskExtractionModal: React.FC<TaskExtractionModalProps> = ({
  documentText,
  extractedTasks,
  onCancel,
}) => {
  // 初期状態として抽出されたタスクを利用
  const [tasks, setTasks] = useState<Task[]>(extractedTasks);
  const { setExtractedTasks } = useProjectStore();
  const router = useRouter();

  // フィールド変更ハンドラ（タイトル、詳細、担当者、期限、タグ）
  const handleFieldChange = (index: number, field: keyof Task, value: string) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][field] = value;
    setTasks(updatedTasks);
  };

  // タグ選択肢（無視は削除済み）
  const tagOptions: Task['tag'][] = ['新規作成', '更新', 'クローズ'];

  // タスク削除
  const handleDeleteTask = (index: number) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
  };

  // タスク追加（初期状態は空）
  const handleAddTask = () => {
    const newTask: Task = {
      title: '',
      tag: '新規作成',
      assignee: '',
      start_date: '',
      due_date: '',
      detail: '',
    };
    setTasks([...tasks, newTask]);
  };

  // タスク登録（タスクの紐づけ）時の処理
  const handleTaskLink = () => {
    setExtractedTasks(tasks);
    router.push('/project-management');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-7xl w-11/12 relative">
        {/* 中止ボタン */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 px-2 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
        >
          中止
        </button>

        <h2 className="text-xl font-bold mb-4 text-center">タスク抽出結果の確認・編集</h2>
        <div className="flex space-x-4 mb-4">
          {/* 左側：元のドキュメント */}
          <div className="flex-1 flex flex-col">
            <h3 className="font-semibold mb-2">元のドキュメント</h3>
            <div className="w-full h-[600px] p-2 border border-gray-300 rounded overflow-auto whitespace-pre-wrap">
              {documentText}
            </div>
          </div>
          {/* 右側：抽出されたタスクの編集 */}
          <div className="flex-1 flex flex-col">
            <h3 className="font-semibold mb-2">抽出されたタスク</h3>

            {/* タスク追加ボタン（見出しの直下に配置） */}
            <div className="flex justify-end mb-2">
              <button
                onClick={handleAddTask}
                className="px-4 py-2 bg-[#173241] text-white rounded hover:bg-[#0F2835]"
              >
                タスクの追加
              </button>
            </div>

            {/* タスク一覧 */}
            <div className="w-full max-h-[500px] overflow-auto space-y-4">
              {tasks.map((task, index) => (
                <div key={index} className="p-4 border rounded shadow-sm">
                  {/* タスク削除ボタン */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDeleteTask(index)}
                      className="text-red-500 hover:text-red-700"
                      title="タスクを削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {/* タイトル */}
                  <div className="mb-2">
                    <label className="block text-sm font-medium">タイトル</label>
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) =>
                        handleFieldChange(index, 'title', e.target.value)
                      }
                      className="w-full mt-1 p-1 border rounded"
                      placeholder="タスク名を入力"
                    />
                  </div>
                  {/* 詳細 */}
                  <div className="mb-2">
                    <label className="block text-sm font-medium">詳細</label>
                    <textarea
                      value={task.detail}
                      onChange={(e) =>
                        handleFieldChange(index, 'detail', e.target.value)
                      }
                      className="w-full mt-1 p-1 border rounded"
                      placeholder="タスクの詳細を入力"
                      rows={3}
                    />
                  </div>
                  {/* 担当者、期限、タグの入力欄（3等分で横並び） */}
                  <div className="flex space-x-2 mt-2">
                    {/* 担当者 */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium">担当者</label>
                      <input
                        type="text"
                        value={task.assignee}
                        onChange={(e) =>
                          handleFieldChange(index, 'assignee', e.target.value)
                        }
                        className="w-full mt-1 p-1 border rounded text-sm"
                        placeholder="担当者"
                      />
                    </div>
                    {/* 期限 */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium">期限</label>
                      <input
                        type="date"
                        value={task.due_date}
                        onChange={(e) =>
                          handleFieldChange(index, 'due_date', e.target.value)
                        }
                        className="w-full mt-1 p-1 border rounded text-sm"
                      />
                    </div>
                    {/* タグ */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium">タグ</label>
                      <select
                        value={task.tag}
                        onChange={(e) =>
                          handleFieldChange(index, 'tag', e.target.value)
                        }
                        className="w-full mt-1 p-1 border rounded text-sm"
                      >
                        {tagOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* タスク登録ボタン */}
            <div className="flex justify-center mt-4">
              <button
                onClick={handleTaskLink}
                className="px-4 py-2 bg-[#173241] text-white rounded hover:bg-[#0F2835]"
              >
                スケジュールに追加する
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskExtractionModal;
