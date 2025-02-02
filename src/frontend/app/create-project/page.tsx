// src/frontend/app/create-project/page.tsx
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

export default function CreateProject() {
  const [customerName, setCustomerName] = useState<string>('');
  const [issues, setIssues] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('営業');
  const [selectedCategory, setSelectedCategory] = useState<string>('プロジェクト');
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const stages = ['営業', '提案', '受注', 'デリバリー中', 'クローズ'];
  const categories = ['プロジェクト', 'ナレッジベース'];

  const handleCreate = async () => {
    if (!customerName || !issues) {
      alert('顧客名と課題を入力してください。');
      return;
    }
    setLoading(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/projects', {
        customer_name: customerName,
        issues: issues,
        stage: selectedStage,
        category: selectedCategory,
        schedule: '[]',
      });
      alert('プロジェクトが作成されました。');
      router.push('/'); // ダッシュボードに戻る
    } catch (error) {
      console.error('Error creating project:', error);
      alert('プロジェクトの作成に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">新規プロジェクト作成</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-gray-700">顧客名</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border rounded px-3 py-2 mt-1"
            placeholder="顧客名を入力"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">課題</label>
          <textarea
            value={issues}
            onChange={(e) => setIssues(e.target.value)}
            className="w-full border rounded px-3 py-2 mt-1"
            placeholder="課題を入力"
            rows={4}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">フェーズ</label>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="w-full border rounded px-3 py-2 mt-1"
          >
            {stages.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">カテゴリ</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full border rounded px-3 py-2 mt-1"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end">
          <Link href="/">
            <button className="px-4 py-2 bg-gray-500 text-white rounded mr-2 hover:bg-gray-600">
              キャンセル
            </button>
          </Link>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? '作成中...' : '作成'}
          </button>
        </div>
      </div>
    </div>
  );
}
