//src/frontend/app/project-management/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import useProjectStore from '../store/projectStore';
import { ChartBar } from 'lucide-react';
import ReactDOM from 'react-dom/client';
import TaskList from '../components/project-management/TaskList';
import TaskForm from '../components/project-management/TaskForm';
import GanttChart from '../components/project-management/GanttChart';

// Task型をexportする
export interface Task {
  title: string;
  assignee: string;
  start_date: string;
  due_date: string;
  detail: string;
  tag: '新規作成' | '更新' | 'クローズ' | '無視' | '';
}

export default function ProjectManagement() {
  useEffect(() => {
    document.querySelector('.page-title')!.textContent = 'プロジェクト管理AI';
    const iconContainer = document.querySelector('.page-icon')!;
    iconContainer.innerHTML = '';
    const icon = document.createElement('div');
    const root = ReactDOM.createRoot(icon);
    root.render(<ChartBar className="h-5 w-5" />);
    iconContainer.appendChild(icon);
  }, []);
  const { extractedTasks } = useProjectStore();

  const [currentTasks, setCurrentTasks] = useState<Task[]>([
    { title: '既存タスクA', assignee: '山田', start_date: '2025-02-08', due_date: '2025-02-11', detail: '詳細A', tag: '' },
    { title: '既存タスクB', assignee: '鈴木', start_date: '2025-02-08', due_date: '2025-02-15', detail: '詳細B', tag: '' },
  ]);

  const handleAddTask = (newTask: Task) => {
    setCurrentTasks([...currentTasks, newTask]);
  };

  return (
    <div className="p-6 h-full">
      <div className="flex flex-col h-full">
        {/* 上側のタスクリストをDHTMLX Ganttチャートに変更 */}
        <div className="h-1/3 overflow-y-auto mb-6">
          <GanttChart currentTasks={currentTasks} /> {/* GanttChartDhtmlx を使用 */}
        </div>

        {/* 下側の領域を左右に分割 */}
        <div className="h-2/3 flex space-x-8">
          {/* 左側のタスクリスト (TaskList) */}
          <div className="w-2/3 overflow-y-auto">
            <TaskList
              extractedTasks={extractedTasks || []} // extractedTasks が undefined の場合を考慮
              currentTasks={currentTasks}
              setCurrentTasks={setCurrentTasks}
            />
          </div>

          {/* 右側のタスク登録フォーム (TaskForm) */}
          <div className="w-1/3 overflow-y-auto">
            <TaskForm onTaskAdd={handleAddTask} />
          </div>
        </div>
      </div>
    </div>
  );
}