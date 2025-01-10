// src/frontend/app/page.tsx
'use client'

import { useEffect, useState } from 'react';
import { Flag, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface Project {
  id: number;
  customer_name: string;
  issues: string;
  has_flow_flag: boolean;
  bpmn_xml: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editedCustomerName, setEditedCustomerName] = useState<string>('');
  const [editedIssues, setEditedIssues] = useState<string>('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await axios.get<Project[]>('http://127.0.0.1:8000/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('プロジェクトの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setEditedCustomerName(project.customer_name);
    setEditedIssues(project.issues);
  };

  const handleUpdate = async (projectId: number) => {
    try {
      await axios.put(`http://127.0.0.1:8000/api/projects/${projectId}`, {
        customer_name: editedCustomerName,
        issues: editedIssues,
      });
      alert('プロジェクトが更新されました。');
      setEditingProjectId(null);
      fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      alert('プロジェクトの更新に失敗しました。');
    }
  };

  const handleDeleteFlow = async (projectId: number) => {
    if (!confirm('本当に業務フローを削除しますか？')) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/projects/${projectId}/flow`);
      alert('業務フローが削除されました。');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting flow:', error);
      alert('業務フローの削除に失敗しました。');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* タイトルと新規作成ボタン */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">プロジェクト管理</h1>
        <Link href="/create-project">
          <button className="px-4 py-2 bg-[#BF4242] text-white font-semibold rounded hover:bg-[#D69292]">
            新規プロジェクト作成
          </button>
        </Link>
      </div>

      {/* プロジェクト一覧テーブル */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">業種業態・担当部署</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">目的・タスク/課題</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">業務フロー</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">アクション</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  ロード中...
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-gray-50 transition-colors border-b"
                >
                  <td className="px-4 py-3">
                    {editingProjectId === project.id ? (
                      <input
                        type="text"
                        value={editedCustomerName}
                        onChange={(e) => setEditedCustomerName(e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      <span className="block text-gray-800 truncate">{project.customer_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingProjectId === project.id ? (
                      <textarea
                        value={editedIssues}
                        onChange={(e) => setEditedIssues(e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        rows={2}
                      />
                    ) : (
                      <p className="text-gray-800 leading-tight break-words max-w-xl">
                        {project.issues}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {project.has_flow_flag ? (
                      <Flag className="h-5 w-5 text-[#76878F] inline" />
                    ) : (
                      <span className="text-gray-500">なし</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingProjectId === project.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(project.id)}
                          className="px-3 py-1 text-white bg-[#BF4242] hover:bg-[#D69292] rounded mr-2"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingProjectId(null)}
                          className="px-3 py-1 text-white bg-gray-500 hover:bg-gray-600 rounded"
                        >
                          キャンセル
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(project)}
                          className="text-gray-800 hover:text-gray-900 mr-2"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        {project.has_flow_flag && (
                          <button
                            onClick={() => handleDeleteFlow(project.id)}
                            className="text-[#BF4242] hover:text-[#D69292]"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                        <Link href={`/generate/${project.id}`}>
                          <button className="ml-2 px-3 py-1 text-white bg-[#173241] hover:bg-[#76878F] rounded">
                            フロー表示
                          </button>
                        </Link>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

