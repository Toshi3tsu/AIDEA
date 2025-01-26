// src/frontend/app/page.tsx
'use client'

import { useEffect, useState } from 'react';
import { Flag, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

interface Project {
  id: number;
  customer_name: string;
  issues: string;
  is_archived: boolean;
  bpmn_xml: string;
  stage: string;
  category: string;
  slack_channel_id: string;
  slack_tag: string;
  box_folder_id?: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stageCounts, setStageCounts] = useState<number[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editedCustomerName, setEditedCustomerName] = useState<string>('');
  const [editedIssues, setEditedIssues] = useState<string>('');
  const [projectStages, setProjectStages] = useState<{ [key: number]: string }>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('すべて');

  const stages = ['営業', '提案', '受注', 'デリバリー中', 'クローズ'];
  const categories = ['すべて', 'プロジェクト', 'ナレッジベース'];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await axios.get<Project[]>('http://127.0.0.1:8000/api/projects');
      const allProjects = response.data;
      const activeProjects = allProjects.filter(p => !p.is_archived);
      const archivedProjects = allProjects.filter(p => p.is_archived);

      setProjects(activeProjects);
      setArchivedProjects(archivedProjects);

      // プロジェクトの分類と集計
      const stageCounts = stages.map(stage =>
        activeProjects.filter(project => project.stage === stage).length
      );
      setStageCounts(stageCounts);

      const stagesMap = allProjects.reduce((map, project) => {
        map[project.id] = project.stage || stages[0];
        return map;
      }, {} as { [key: number]: string });
      setProjectStages(stagesMap);

    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('プロジェクトの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    if (selectedCategory === 'すべて') return true;
    return project.category === selectedCategory;
  });

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

  const handleArchive = async (projectId: number) => {
    if (!confirm('本当にこのプロジェクトをアーカイブしますか？')) return;
    try {
      // アーカイブは is_archived を true に設定する更新と仮定
      await axios.put(`http://127.0.0.1:8000/api/projects/${projectId}/archive`, {
        is_archived: true,
      });
      alert('プロジェクトがアーカイブされました。');
      fetchProjects();
    } catch (error) {
      console.error('Error archiving project:', error);
      alert('プロジェクトのアーカイブに失敗しました。');
    }
  };

  const handleUnarchive = async (projectId: number) => {
    if (!confirm('このプロジェクトをアサインに戻しますか？')) return;
    try {
      await axios.put(`http://127.0.0.1:8000/api/projects/${projectId}/archive`, {
        is_archived: false,
      });
      alert('プロジェクトがアサインに戻されました。');
      fetchProjects();
    } catch (error) {
      console.error('Error unarchiving project:', error);
      alert('プロジェクトのアサイン戻しに失敗しました。');
    }
  };

  const handleStageChange = async (projectId: number, stage: string) => {
    setProjectStages(prev => ({ ...prev, [projectId]: stage }));
    try {
      await axios.put(`http://127.0.0.1:8000/api/projects/${projectId}/stage`, { stage });
      alert('ステージが更新されました。');
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('ステージの更新に失敗しました。');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* タイトルと新規作成ボタン */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800">アサイン一覧</h1>
        <Link href="/create-project">
          <button className="px-4 py-2 bg-[#173241] text-white font-semibold rounded hover:bg-[#0F2835]">
            プロジェクト新規作成
          </button>
        </Link>
      </div>

      <div className="mb-4">
        <label htmlFor="category-filter" className="mr-2 font-medium text-gray-700">カテゴリでフィルタリング:</label>
        <select
          id="category-filter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border rounded px-2 py-1"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* フェーズごとの棒グラフ */}
      <div className="bg-white shadow rounded-lg p-4 mt-2 mb-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">プロジェクトのステータス</h2>
        <div className="w-full h-36">
          <Bar
            data={{
              labels: stages, // フェーズ名
              datasets: [
                {
                  label: 'プロジェクト数',
                  data: stageCounts, // フェーズごとのカウント
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  borderColor: 'rgba(75, 192, 192, 1)',
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false, // 高さを自由に設定できるようにする
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1,
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* プロジェクト一覧テーブル */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">業種業態・担当部署</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">目的・課題</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">フェーズ</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">カテゴリ</th>
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
              filteredProjects.map((project) => (
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
                    <select
                      value={projectStages[project.id] || stages[0]}
                      onChange={(e) => handleStageChange(project.id, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      {stages.map((stage) => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-800">
                    {project.category}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingProjectId === project.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(project.id)}
                          className="px-3 py-1 text-white bg-[#BF4242] hover:bg-[#A53939] rounded mr-2"
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
                        <button
                          onClick={() => handleArchive(project.id)}
                          className="ml-2 px-3 py-1 text-white bg-[#173241] hover:bg-[#0F2835] rounded"
                        >
                          アーカイブ
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* アーカイブされたプロジェクト一覧 */}
      <h2 className="text-2xl font-bold text-gray-800 mb-4 px-4">アーカイブされたプロジェクト</h2>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">業種業態・担当部署</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">目的・課題</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">カテゴリ</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">アクション</th>
            </tr>
          </thead>
          <tbody>
            {archivedProjects.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                  アーカイブされたプロジェクトはありません。
                </td>
              </tr>
            ) : (
              archivedProjects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 transition-colors border-b">
                  <td className="px-4 py-3 text-gray-800">{project.customer_name}</td>
                  <td className="px-4 py-3 text-gray-800">{project.issues}</td>
                  <td className="px-4 py-3 text-center text-gray-800">
                    {project.category}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleUnarchive(project.id)}
                      className="ml-2 px-3 py-1 text-white bg-[#173241] hover:bg-[#0F2835] rounded"
                    >
                      アサイン
                    </button>
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

