// src/frontend/app/components/project-management/TaskList.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../../../src/types/document';
import axios from 'axios';
import useProjectStore from '../../store/projectStore'; // 追加：抽出タスクを更新するため

interface TaskListProps {
  extractedTasks: Task[];
  currentTasks: Task[];
  setCurrentTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const TaskList: React.FC<TaskListProps> = ({ extractedTasks, currentTasks, setCurrentTasks }) => {
  // storeからsetExtractedTasksを取得（抽出タスクの更新用）
  const { selectedProject, setExtractedTasks } = useProjectStore();

  const [linkedPairs, setLinkedPairs] = useState<{ extractedIndex: number; currentIndex: number }[]>([]);

  // ドットの参照用 ref
  const leftDotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightDotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleDotClick = (index: number, type: 'extracted' | 'current') => {
    if (type === 'extracted') {
      setLinkedPairs((prev) =>
        prev.some((pair) => pair.extractedIndex === index)
          ? prev.filter((pair) => pair.extractedIndex !== index)
          : [...prev, { extractedIndex: index, currentIndex: -1 }]
      );
    } else if (type === 'current') {
      setLinkedPairs((prev) =>
        prev.map((pair) =>
          pair.currentIndex === -1 ? { ...pair, currentIndex: index } : pair
        )
      );
    }
  };

  const handleLinkTasks = async () => {
    // まず、既存の紐づけ（新規以外）のタスクについては更新
    const updatedTasks = [...currentTasks];
    linkedPairs.forEach(({ extractedIndex, currentIndex }) => {
      const extractedTask = extractedTasks[extractedIndex];
      // 紐づけ対象が既存タスクかつ「新規作成」以外なら上書き更新
      if (currentIndex !== -1 && extractedTask.tag !== '新規作成') {
        updatedTasks[currentIndex] = { ...extractedTask };
      }
    });

    // 次に、抽出タスク全体の中から「新規作成」タグのタスクを抽出（紐づけ済みかどうかは問わない）
    const newTasks = extractedTasks.filter((task) => task.tag === '新規作成');
    const createdTasks = [];

    // 各新規タスクをDBに登録（POSTリクエスト）
    for (const task of newTasks) {
      try {
        // ※バックエンド側のエンドポイントURLや必要なフィールド（project_id, user_id など）に合わせて調整してください
        const response = await axios.post('http://127.0.0.1:8000/api/project_tasks/', {
          title: task.title,
          assignee: task.assignee,
          start_date: task.start_date || new Date().toISOString(), // 例：現在時刻をデフォルト値として設定
          due_date: task.due_date,
          detail: task.detail,
          tag: task.tag,
          user_id: "user_888",
          project_id: task.project_id || (selectedProject ? selectedProject.id : 0),
        });
        createdTasks.push(response.data);
      } catch (error) {
        console.error('タスクの作成に失敗しました:', error);
      }
    }

    // 現在のタスク一覧に更新・新規登録したタスクを反映
    setCurrentTasks([...updatedTasks, ...createdTasks]);

    // 次に、抽出タスク一覧から「処理済み」のタスクを削除する
    // 「処理済み」とは、（a）紐づけ対象として処理されたタスク（linkedPairsに含まれるタスク）
    // 　　　　　（b）「新規作成」タグのタスク（常にDBに登録済み）
    const processedExtractedIndices = new Set<number>([
      ...linkedPairs.map((pair) => pair.extractedIndex),
      ...extractedTasks
        .map((task, index) => (task.tag === '新規作成' ? index : -1))
        .filter((index) => index !== -1),
    ]);
    const remainingExtractedTasks = extractedTasks.filter(
      (_, index) => !processedExtractedIndices.has(index)
    );
    setExtractedTasks(remainingExtractedTasks);

    // リンク済みペアもクリア
    setLinkedPairs([]);

    alert('タスクの紐づけが完了しました。');
  };

  const renderLinkLines = () => {
    const [svgRect, setSvgRect] = useState<DOMRect | null>(null);

    // クライアントサイドで実行時にSVG要素の位置を取得
    useEffect(() => {
      const svgElement = document.querySelector('svg');
      if (svgElement) {
        setSvgRect(svgElement.getBoundingClientRect());
      }
    }, []);

    if (!svgRect) return null; // サーバーサイドでのレンダリングやSVG未取得時は描画しない

    return linkedPairs.map((pair, index) => {
      const leftDot = leftDotRefs.current[pair.extractedIndex];
      const rightDot = pair.currentIndex !== -1 ? rightDotRefs.current[pair.currentIndex] : null;

      if (!leftDot) return null;

      // 左側のドット位置を取得
      const leftRect = leftDot.getBoundingClientRect();
      const startX = leftRect.left + leftRect.width / 2 - svgRect.left;
      const startY = leftRect.top + leftRect.height / 2 - svgRect.top;

      // 右側のドット位置を取得
      let endX = startX;
      let endY = startY;
      if (rightDot) {
        const rightRect = rightDot.getBoundingClientRect();
        endX = rightRect.left + rightRect.width / 2 - svgRect.left;
        endY = rightRect.top + rightRect.height / 2 - svgRect.top;
      }

      return (
        <line
          key={index}
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="black"
          strokeWidth={2}
        />
      );
    });
  };

  const canSelectExtractedTask = (task: Task) =>
    task.tag === '更新' || task.tag === 'クローズ';

  return (
    <div className="relative flex space-x-8 h-full">
      {/* 左側のタスク（抽出されたタスク） */}
      <div className="w-1/2">
        <h2 className="text-xl font-semibold mb-2">抽出されたタスク</h2>
        <ul className="border p-2 rounded">
          {extractedTasks.map((task, index) => (
            <li
              key={index}
              className={`mb-4 border-b pb-2 flex items-center ${
                // 「新規作成」タスクは紐づけ不可なのでopacity-50で表示するなどの調整も可能
                canSelectExtractedTask(task) ? '' : 'opacity-50'
              }`}
            >
              <div className="flex-grow">
                <div className="font-medium">{task.title}</div>
                <div>担当: {task.assignee}</div>
                <div>期限: {task.due_date}</div>
                <div>詳細: {task.detail}</div>
                <div>タグ: {task.tag}</div>
              </div>
              <div
                ref={(el) => (leftDotRefs.current[index] = el)} // 左側のドットの ref
                className={`w-4 h-4 rounded-full bg-blue-500 cursor-pointer ${
                  linkedPairs.some((pair) => pair.extractedIndex === index)
                    ? 'bg-blue-700'
                    : ''
                }`}
                onClick={() =>
                  // 「更新」「クローズ」のタスクのみ選択可能とする場合は条件チェック
                  canSelectExtractedTask(task) && handleDotClick(index, 'extracted')
                }
              />
            </li>
          ))}
        </ul>
      </div>

      {/* SVGを使用して線を描画 */}
      <svg
        className="absolute"
        style={{ left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        {renderLinkLines()}
      </svg>

      {/* 右側のタスク（現在のタスク） */}
      <div className="w-1/2">
        <h2 className="text-xl font-semibold mb-2">現在のタスク</h2>
        <ul className="border p-2 rounded">
          {currentTasks.map((task, index) => (
            <li key={index} className="mb-4 border-b pb-2 flex items-center">
              <div
                ref={(el) => (rightDotRefs.current[index] = el)} // 右側のドットの ref
                className={`w-4 h-4 rounded-full bg-green-500 cursor-pointer ${
                  linkedPairs.some((pair) => pair.currentIndex === index)
                    ? 'bg-green-700'
                    : ''
                }`}
                onClick={() => handleDotClick(index, 'current')}
              />
              <div className="flex-grow ml-2">
                <div className="font-medium">{task.title}</div>
                <div>担当: {task.assignee}</div>
                <div>期限: {task.due_date}</div>
                <div>詳細: {task.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-center mt-4 w-full absolute bottom-0 left-0 p-4">
        <button
          onClick={handleLinkTasks}
          className="px-4 py-2 bg-[#BF4242] text-white rounded hover:bg-[#A53939]"
        >
          タスクの紐づけを行う
        </button>
      </div>
    </div>
  );
};

export default TaskList;
