// src/frontend/app/settings/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { Upload, Edit2, Trash2, Search } from 'lucide-react';
import BpmnViewer from '../generate/BpmnViewer';
import useFlowStore from '../store/flowStore';

export default function Settings() {
  const { generatedFlow, setGeneratedFlow } = useFlowStore();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [solutions, setSolutions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSolution, setEditingSolution] = useState(null);

  // Fetch solutions from backend
  useEffect(() => {
    const fetchSolutions = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/solutions');
        if (!response.ok) throw new Error('Failed to fetch solutions');
        const data = await response.json();
        setSolutions(data);
      } catch (error) {
        console.error('Error fetching solutions:', error);
        alert('Failed to load solutions.');
      }
    };
    fetchSolutions();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => setUploadProgress(0), 1000);
        }
      }, 500);
    }
  };

  const handleEdit = async (id: string) => {
    const solution = solutions.find((s) => s.id === id);
    if (!solution) return;

    const updatedName = prompt('Edit Solution Name:', solution.name);
    if (updatedName) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/solutions/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...solution, name: updatedName }),
        });
        if (!response.ok) throw new Error('Failed to update solution');
        const updatedSolution = await response.json();
        setSolutions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...updatedSolution } : s))
        );
      } catch (error) {
        console.error('Error updating solution:', error);
        alert('Failed to update solution.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this solution?')) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/solutions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete solution');
      setSolutions((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Error deleting solution:', error);
      alert('Failed to delete solution.');
    }
  };

  const filteredSolutions = solutions.filter((solution) =>
    solution.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* タイトル */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">設定</h1>
      </div>

      {/* BPMN Viewer Section
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">保存された業務フロー</h2>
        {generatedFlow ? (
          <BpmnViewer xml={generatedFlow} />
        ) : (
          <p className="text-gray-500">現在保存されている業務フローはありません。</p>
        )}
      </div> */}

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">ソリューションデータのアップロード</h2>
        <div className="flex items-center space-x-4">
          <label className="cursor-pointer bg-[#BF4242] text-white px-4 py-2 rounded flex items-center hover:bg-[#D69292]">
            <Upload className="mr-2" />
            ファイルを選択
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".csv,.xlsx"
            />
          </label>
          <span className="text-sm text-gray-600">対応フォーマット: CSV, Excel</span>
        </div>
        {uploadProgress > 0 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-[#76878F] h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Solution Database Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">ソリューションデータベース</h2>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="ソリューションを検索..."
            className="pl-10 p-2 border rounded w-full focus:ring-[#76878F] focus:border-[#76878F]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">名前</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">カテゴリー</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">特徴</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">アクション</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSolutions.map((solution) => (
              <tr key={solution.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-800">{solution.name}</td>
                <td className="px-4 py-3 text-gray-800">{solution.category}</td>
                <td className="px-4 py-3 text-gray-800">{solution.features}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleEdit(solution.id)}
                    className="text-[#173241] hover:text-[#76878F] mr-2"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(solution.id)}
                    className="text-[#BF4242] hover:text-[#D69292]"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
