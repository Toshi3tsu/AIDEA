// src/frontend/app/components/RightSidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import { Info, Clipboard, ClipboardCheck } from 'lucide-react';
import Select from 'react-select';
import useProjectStore from '../store/projectStore';
import axios from 'axios';

export default function RightSidebar() {
  const [clipboardMessage, setClipboardMessage] = useState('Copy to Clipboard');
  const { projects, selectedProject, setProjects, setSelectedProject } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get<Project[]>('http://127.0.0.1:8000/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('プロジェクトの取得に失敗しました。');
    }
  };

  const handleProjectSelect = (selectedOption: any) => {
    const project = projects.find((p) => p.id === selectedOption?.value);
    setSelectedProject(project || null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText('Example text to copy');
    setClipboardMessage('Copied!');
    setTimeout(() => setClipboardMessage('Copy to Clipboard'), 2000);
  };

  return (
    <div className="w-64 bg-gray-50 shadow-lg flex flex-col p-4">
      {/* サイドバーヘッダー */}
      <div className="flex items-center justify-between border-b pb-4 mb-4">
        <h2 className="text-lg font-bold">プロジェクト選択</h2>
        <Info className="h-5 w-5 text-gray-600" />
      </div>

      {/* プロジェクト選択ドロップダウン */}
      <div className="mb-4">
        <Select
          options={projects.map((project) => ({
            value: project.id,
            label: `${project.customer_name} - ${project.issues.substring(0, 30)}${project.issues.length > 30 ? '...' : ''}`,
          }))}
          onChange={handleProjectSelect}
          placeholder="プロジェクトを選択してください"
          isClearable
          value={
            selectedProject
              ? {
                  value: selectedProject.id,
                  label: `${selectedProject.customer_name} - ${selectedProject.issues.substring(0, 30)}${selectedProject.issues.length > 30 ? '...' : ''}`,
                }
              : null
          }
        />
      </div>

      {/* 情報表示セクション */}
      <div className="flex-1 space-y-4">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold text-sm text-gray-700">Generated Overview</h3>
          <p className="text-gray-600 text-xs mt-2">
            This panel displays additional context or details related to the selected solution.
          </p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold text-sm text-gray-700">Usage Tips</h3>
          <ul className="list-disc list-inside text-gray-600 text-xs mt-2">
            <li>Click "Generate" to create solutions.</li>
            <li>Use settings to adjust preferences.</li>
          </ul>
        </div>
      </div>

      {/* 操作セクション */}
      <div className="mt-4 border-t pt-4">
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center bg-[#173241] text-white px-4 py-2 rounded"
        >
          {clipboardMessage === 'Copied!' ? (
            <ClipboardCheck className="mr-2 h-4 w-4" />
          ) : (
            <Clipboard className="mr-2 h-4 w-4" />
          )}
          {clipboardMessage}
        </button>
      </div>
    </div>
  );
}