//src/frontend/app/product-management/page.tsx
'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Layers } from 'lucide-react';
import ReactDOM from 'react-dom/client';

export default function ProductManagement() {
  useEffect(() => {
        document.querySelector('.page-title')!.textContent = 'プロダクト管理';
        const iconContainer = document.querySelector('.page-icon')!;
        iconContainer.innerHTML = '';
        const icon = document.createElement('div');
        const root = ReactDOM.createRoot(icon); // root を作成
        root.render(<Layers className="h-5 w-5" />); // root の render メソッドを使用
        iconContainer.appendChild(icon);
      }, []);
  const [conceptText, setConceptText] = useState('')
  const [designNotes, setDesignNotes] = useState('')
  const projectId = 1

  // メモを取得
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/notes/${projectId}`)
        setConceptText(response.data.concept_text)
        setDesignNotes(response.data.design_notes)
      } catch (error) {
        console.error('メモの取得に失敗しました:', error)
      }
    }
    fetchNotes()
  }, [projectId])

  // メモを保存
  const saveNotes = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/api/notes', {
        project_id: projectId,
        concept_text: conceptText,
        design_notes: designNotes,
      })
      alert('メモが保存されました！')
    } catch (error) {
      console.error('メモの保存に失敗しました:', error)
      alert('メモの保存に失敗しました')
    }
  }
  
  return (
    <div className="flex flex-col p-6 bg-gray-50 min-h-screen">
      {/* 上側: コンセプト図 */}
      <div className="flex-1 bg-white shadow-md rounded-lg p-4 mb-4">
        <h2 className="text-xl font-bold mb-4">外部・内部環境の変化</h2>
        <div className="flex items-center justify-center h-100 border border-dashed border-gray-300 rounded-lg p-6">
          <img
            src="/concept.png"
            alt="コンセプト図"
            className="h-full w-auto ml-3 mr-3"
          />
        </div>
      </div>
  
      {/* 下側: メモエリア */}
      <div className="flex-1 bg-white shadow-md rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">設計コンセプト</h2>
        <textarea
          className="w-full h-12 mb-4 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="設計コンセプトについてのメモを記述してください..."
          value={designNotes}
          onChange={(e) => setDesignNotes(e.target.value)}
        />
        <h2 className="text-xl font-bold mb-4">解決したい課題</h2>
        <textarea
          className="w-full h-32 mb-4 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="課題についてのメモを記述してください..."
          value={conceptText}
          onChange={(e) => setConceptText(e.target.value)}
        />
        <button
          onClick={saveNotes}
          className="mt-2 w-full bg-[#173241] text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          メモを保存
        </button>
      </div>
    </div>
  );
}