// src/frontend/app/components/project-management/GanttChart.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { Task } from '../../../src/types/document';
import 'dhtmlx-gantt'; // dhtmlx-gantt の本体をインポート
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'; // CSS は念のためこちらもインポート (不要な場合は削除可)

interface GanttChartDhtmlxProps {
  currentTasks: Task[];
}

const GanttChartDhtmlx: React.FC<GanttChartDhtmlxProps> = ({ currentTasks }) => {
  const ganttContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ganttContainerRef.current) return;

    // Gantt の初期化
    (window as any).gantt.init(ganttContainerRef.current); // window.gantt としてアクセス

    // タスクデータを DHTMLX Gantt の形式に変換
    const ganttTasks = {
      data: currentTasks.map((task, index) => ({
        id: index + 1, // DHTMLX Gantt の id は数値である必要あり
        text: task.title,
        start_date: new Date(task.start_date), // Dateオブジェクトに変換
        end_date: new Date(task.due_date), // Dateオブジェクトに変換
        duration: 1, // デフォルトのタスク期間 (日単位、必要に応じて調整)
        progress: 0, // 進捗率 (0-1)
      })),
      links: [], // リンク機能は今回は使用しないため空
    };

    // データの読み込み
    (window as any).gantt.parse(ganttTasks); // window.gantt としてアクセス

    return () => {
      // コンポーネントアンマウント時に Gantt を破棄 (メモリリーク対策)
      (window as any).gantt.clearAll(); // window.gantt としてアクセス
      // (window as any).gantt.destroy(); // window.gantt としてアクセス
    };
  }, [currentTasks]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">ガントチャート (DHTMLX Gantt)</h2>
      <div ref={ganttContainerRef} style={{ width: '100%', height: '400px' }}></div>
    </div>
  );
};

export default GanttChartDhtmlx;