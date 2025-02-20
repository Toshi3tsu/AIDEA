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

let renderCount = 0;

export default function ProjectManagement() {
  renderCount++;
  console.log(`ProjectManagement コンポーネント レンダリング ${renderCount}回目`); // レンダリング回数をログ出力
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
  const isInitialLoad = useRef(true); // 初回ロード判定用のrefを追加

  // APIからタスクを取得
  useEffect(() => {
    const fetchTasks = async () => {
      if (!selectedProject) {
        setExtractedTasks([]); // selectedProject が null の場合も extractedTasks をクリア
        setCurrentTasks([]); // currentTasksもクリア
        return;
      }
  
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/project_tasks?project_id=${selectedProject.id}`);
        const tasksFromDB = response.data || [];
  
        // DBからの取得結果は currentTasks にのみセット
        setCurrentTasks(tasksFromDB);
  
        // 初回ロード時のみ extractedTasks を初期化する
        if (isInitialLoad.current) {
          if (!extractedTasks || extractedTasks.length === 0) {
            setExtractedTasks(tasksFromDB);
          }
          isInitialLoad.current = false;
        }
      } catch (error) {
        console.error('タスクの取得に失敗しました:', error);
        setCurrentTasks([]);
      }
    };
  
    fetchTasks();
    // 依存配列を selectedProject のみにする
  }, [selectedProject]);

  // extractedTasks が更新されたら currentTasks を更新 (StoreとUIの同期を強化)
  useEffect(() => {
    if (extractedTasks && extractedTasks.length > 0) {
      setCurrentTasks(extractedTasks); // extractedTasks を currentTasks に反映
    } else if (selectedProject) {
      // extractedTasks が空で selectedProject が存在する場合、再度APIから取得するなどの処理も検討可能
      // 今回は空の場合は currentTasks も空にする
      setCurrentTasks([]);
    }
  }, [extractedTasks, selectedProject]);

  const handleAddTask = (newTask: Task) => {
    setCurrentTasks([...currentTasks, newTask]);
  };

  return (
    <div className="p-6 h-full">
      <div className="flex flex-col h-full">
        {/* 上側のタスクリストをDHTMLX Ganttチャートに変更 */}
        <div className="h-1/3 overflow-y-auto mb-6">
          <GanttChart
            currentTasks={currentTasks}
            projectId={selectedProject?.id} // projectId を渡す
          />
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