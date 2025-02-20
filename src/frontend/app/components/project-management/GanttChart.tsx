// src/frontend/app/components/project-management/GanttChart.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Task } from '../../../src/types/document';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'; // CSS は念のためこちらもインポート

interface GanttChartDhtmlxProps {
  currentTasks: Task[];
  projectId: number | undefined;
}

const GanttChartDhtmlx: React.FC<GanttChartDhtmlxProps> = ({ currentTasks, projectId }) => {
  const ganttContainerRef = useRef<HTMLDivElement>(null);
  const isEventListenerAttached = useRef(false);
  const eventIdRef = useRef<number | null>(null);

  useEffect(() => {
    console.log("GanttChartDhtmlx useEffect 発火, currentTasks:", currentTasks); // currentTasks の変化をログ出力
    if (!ganttContainerRef.current || projectId === undefined) return;
  
    const initializeGantt = async () => {
      // dhtmlx-gantt を動的インポート
      const ganttModule = await import('dhtmlx-gantt'); 
      const gantt = (window as any).gantt || ganttModule;
  
      // 編集機能を有効にするために、editableをtrueに設定
      gantt.config.editable = true;
  
      // Gantt の初期化
      gantt.init(ganttContainerRef.current);
  
      // タスクデータを DHTMLX Gantt の形式に変換
      const ganttTasks = {
        data: currentTasks.map((task) => ({
          id: task.id,
          text: task.title,
          start_date: new Date(task.start_date),
          end_date: new Date(task.due_date),
          duration: 1,
          progress: 0,
          // 他のプロパティが必要な場合はここに追加
        })),
        links: [],
      };
  
      // データの読み込み
      gantt.parse(ganttTasks);
  
      if (!isEventListenerAttached.current) { // ref.currentで判定
        if ((window as any).gantt) { // gantt オブジェクトが存在することを確認
          let eventCount = 0;
          const onAfterTaskUpdateHandler = async (id: number, updatedTask: any) => {
            eventCount++;
            console.log(`onAfterTaskUpdate イベント発火 ${eventCount}回目`, id, updatedTask);

            const updateData = {
              title: updatedTask.text,
              start_date: updatedTask.start_date,
              due_date: updatedTask.end_date,
            };

            try {
              const response = await fetch(`http://127.0.0.1:8000/api/project_tasks/${id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
              });

              if (!response.ok) {
                console.error('タスク更新APIエラー', response.status, response.statusText);
                gantt.message({
                  type: "error",
                  text: "タスクの更新に失敗しました。"
                });
                return;
              }

              const responseData = await response.json();
              console.log('タスク更新API成功', responseData);
              gantt.message("タスクを更新しました。");
            } catch (error) {
              console.error('タスク更新APIリクエストエラー', error);
              gantt.message({
                type: "error",
                text: "タスクの更新中にエラーが発生しました。"
              });
            }
          };
          const eventId = gantt.attachEvent("onAfterTaskUpdate", onAfterTaskUpdateHandler); // イベントIDを取得
          eventIdRef.current = eventId; // refにイベントIDを保存
          console.log("onAfterTaskUpdate イベントリスナー登録");
          isEventListenerAttached.current = true; // ref.currentを更新
        }
      }
    };
  
    initializeGantt();
  
    return () => {
      // コンポーネントアンマウント時に、window.gantt が存在する場合のみ clearAll() を実行する
      if ((window as any).gantt) {
        if (eventIdRef.current) {
          (window as any).gantt.detachEvent(eventIdRef.current); // イベントIDを使ってdetach
          eventIdRef.current = null; // イベントIDをリセット
          console.log("onAfterTaskUpdate イベントリスナー解除");
        }
        (window as any).gantt.clearAll();
        console.log("Gantt Chart cleared");
        isEventListenerAttached.current = false; // ref.currentをリセット (念のため)
      }
      // ※ 必要に応じて destroy() を使用しても良い
    };
  }, [currentTasks, projectId]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">ガントチャート (DHTMLX Gantt)</h2>
      <div ref={ganttContainerRef} style={{ width: '100%', height: '400px' }}></div>
    </div>
  );
};

export default GanttChartDhtmlx;
