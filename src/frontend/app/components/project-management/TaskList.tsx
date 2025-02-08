// src/frontend/app/components/project-management/TaskList.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../../project-management/page';

interface TaskListProps {
  extractedTasks: Task[];
  currentTasks: Task[];
  setCurrentTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const TaskList: React.FC<TaskListProps> = ({ extractedTasks, currentTasks, setCurrentTasks }) => {
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

  const handleLinkTasks = () => {
    const updatedTasks = [...currentTasks];
    const newTasks = [];

    linkedPairs.forEach(({ extractedIndex, currentIndex }) => {
      const extractedTask = extractedTasks[extractedIndex];

      if (currentIndex !== -1) {
        // 上書き
        updatedTasks[currentIndex] = { ...extractedTask };
      } else if (extractedTask?.tag === '新規作成') {
        // 新規追加
        newTasks.push(extractedTask);
      }
    });

    setCurrentTasks([...updatedTasks, ...newTasks]);
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
            <li
              key={index}
              className="mb-4 border-b pb-2 flex items-center"
            >
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

      <div className="flex justify-center mt-4 w-full absolute bottom-0 left-0 p-4"> {/* bg-white を追加 */}
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