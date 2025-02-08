//src/frontend/app/project-management/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import useProjectStore from '../store/projectStore';
import { ChartBar } from 'lucide-react';
import ReactDOM from 'react-dom/client';
import TaskList from '../components/project-management/TaskList';
import TaskForm from '../components/project-management/TaskForm';
import GanttChart from '../components/project-management/GanttChart';
import { Task } from '../../src/types/document';

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
  const { selectedProject, setExtractedTasks, extractedTasks } = useProjectStore(); // extractedTasksを取得
  const [currentTasks, setCurrentTasks] = useState<Task[]>([]);

  // APIからタスクを取得
  useEffect(() => {
    const fetchTasks = async () => {
      if (!selectedProject) return;

      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/project_tasks?project_id=${selectedProject.id}`); // APIエンドポイントにリクエスト

        const tasks = response.data || [];

        setExtractedTasks(tasks); // データをzustandに保存
        setCurrentTasks(tasks);
      } catch (error) {
        console.error('タスクの取得に失敗しました:', error);
        setExtractedTasks([]);
        setCurrentTasks([]);
      }
    };

    fetchTasks();
  }, [selectedProject, setExtractedTasks]);

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