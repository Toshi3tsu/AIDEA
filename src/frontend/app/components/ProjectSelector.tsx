// src/frontend/app/components/ProjectSelector.tsx
'use client'

import React, { useState, useEffect } from 'react';
import useProjectStore from '../store/projectStore';
import { usePathname } from 'next/navigation';
import { Power } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  assignee: string;
  start_date: string;
  due_date: string;
  detail: string;
  tag: string;
  user_id: string;
  project_id: number;
}

export default function ProjectSelector() {
  const { projects, selectedProject, setSelectedProject } = useProjectStore();
  const pathname = usePathname();
  const [projectMode, setProjectMode] = useState(false); // プロジェクトモードの状態を追加
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | ''>('');

  const handleProjectSelect = (projectId: number) => {
    const project = projects.find((p) => p.id === projectId);
    setSelectedProject(project || null);
  };

  // プロジェクトに応じたタスクをDBから取得
  useEffect(() => {
    // プロジェクト未選択の場合はタスクをクリア
    if (!selectedProject) {
      setTasks([]);
      setSelectedTaskId('');
      return;
    }

    const fetchTasks = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/project_tasks?project_id=${selectedProject.id}`);
        if (!response.ok) {
          throw new Error('タスクの取得に失敗しました。');
        }
        const data: Task[] = await response.json();
        setTasks(data);
        // 必要に応じて最初のタスクを自動選択するなどの処理も可能
        setSelectedTaskId('');
      } catch (error) {
        console.error(error);
        setTasks([]);
      }
    };

    fetchTasks();
  }, [selectedProject]);

  const archivedProjects = projects.filter(project => {
    if (pathname === '/generate/sales-material') { // || pathname === '/project-management'
      return !project.is_archived && project.category === 'プロジェクト'; // コンサルティングAI または プロジェクトAI ページ
    } else {
      return !project.is_archived; // その他のページ
    }
  });

  useEffect(() => {
    if (
      (pathname === '/generate/sales-material') &&
      selectedProject &&
      selectedProject.category === 'ナレッジベース'
    ) {
      setSelectedProject(null);
    }
  }, [pathname, selectedProject, setSelectedProject]);

  return (
    <div className="ml-auto flex items-center space-x-2">
      {/* circle-power ボタン */}
      <button
        onClick={() => setProjectMode(!projectMode)}
        className={`p-2 rounded-full hover:bg-gray-100 ${projectMode ? 'bg-[#CB6CE6]' : ''}`}
        title="プロジェクトモード（選択中のプロジェクトとタスクの情報が与えられるようになります。）"
      >
        <Power size={20} color={projectMode ? 'white' : 'black'} />
      </button>

      {/* プロジェクト名ドロップダウン */}
      <div className="flex items-center">
        <label className="mr-2 text-sm">プロジェクト名：</label>
        <select
          className={`px-3 py-2 border rounded text-sm ${projectMode ? 'bg-[rgba(203,108,230,0.2)]' : ''}`}
          onChange={(e) => handleProjectSelect(Number(e.target.value))}
          value={selectedProject?.id || ''}
        >
          <option value="" disabled={archivedProjects.length === 0}>
            {archivedProjects.length > 0 ? 'プロジェクトを選択してください' : 'プロジェクトがありません'}
          </option>
          {archivedProjects.length > 0 &&
            archivedProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.customer_name}
              </option>
            ))}
        </select>
      </div>

      {/* タスク名ドロップダウン */}
      <div className="flex items-center">
        <label className="mr-2 text-sm">タスク名：</label>
        <select
          className={`px-3 py-2 border rounded text-sm ${projectMode ? 'bg-[rgba(203,108,230,0.2)]' : ''}`}
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(Number(e.target.value))}
          disabled={!selectedProject}  // プロジェクト未選択時は選択不可
        >
          {!selectedProject ? (
            <option value="">プロジェクトを選択してください。</option>
          ) : tasks.length === 0 ? (
            <option value="">タスクがありません</option>
          ) : (
            <>
              <option value="">
                タスクを選択してください
              </option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </>
          )}
        </select>
      </div>
    </div>
  );
}
