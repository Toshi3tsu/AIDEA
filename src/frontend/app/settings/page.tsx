// src/frontend/app/settings/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { Upload, Edit2, Trash2, Search, Download } from 'lucide-react';
import useFlowStore from '../store/flowStore';
import useProjectStore from '../store/projectStore';
import axios from 'axios';
import Select from 'react-select';
import { FaRobot, FaUser } from 'react-icons/fa';
import msalInstance from '../config/msalInstance';

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

interface SlackChannel {
  id: string;
  name: string;
}

interface ProjectSlackLink {
  project_id: number;
  slack_channel_id: string;
}

interface BoxFolderInfo {
  id: string;
  name: string;
}

interface UploadedFile {
  filename: string;
  filepath: string;
  project_id: number;
}

interface SelectionOption {
  value: string;
  label: string;
  type: 'file' | 'slack';
}

export default function Settings() {
  const { generatedFlow, setGeneratedFlow } = useFlowStore();
  const { projects, setProjects, slackChannels, setSlackChannels, 
    connectedSlackChannels, setConnectedSlackChannels, projectFiles, setProjectFiles, } = useProjectStore();
  const [boxFolderInfos, setBoxFolderInfos] = useState<{ [projectId: number]: BoxFolderInfo | null }>({});
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSolution, setEditingSolution] = useState(null);
  const [activeTab, setActiveTab] = useState<'fileApi' | 'solution' | 'masking'>('fileApi');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isMsalInitialized, setIsMsalInitialized] = useState(false);
  const [groupLinks, setGroupLinks] = useState<{ [projectId: number]: string }>({});

  const initializeMsal = async () => {
    try {
      if (!isMsalInitialized) {
        await msalInstance.initialize(); // MSAL インスタンスを初期化
        setIsMsalInitialized(true); // 初期化完了フラグを設定
      }
    } catch (error) {
      console.error('Failed to initialize MSAL:', error);
    }
  };

  const fetchAccessToken = async () => {
    try {
      const accounts = msalInstance.getAllAccounts();
      let response;

      if (accounts.length > 0) {
        // サイレント認証
        response = await msalInstance.acquireTokenSilent({
          scopes: ['https://graph.microsoft.com/.default'],
          account: accounts[0],
        });
      } else {
        // リダイレクト認証を使用
        await msalInstance.loginRedirect({
          scopes: ['https://graph.microsoft.com/.default'],
        });

        // リダイレクト後にトークンを取得
        response = await msalInstance.acquireTokenSilent({
          scopes: ['https://graph.microsoft.com/.default'],
          account: msalInstance.getAllAccounts()[0], // リダイレクト後にアカウントを取得
        });
      }

      setAccessToken(response.accessToken);
      console.log('Access Token:', response.accessToken);
    } catch (error) {
      console.error('Error fetching access token:', error);
    }
  };

  // 特定のグループ ID に関連するプランを取得する関数
  const fetchPlansByGroup = async (groupId: string, token: string) => {
    try {
      const response = await axios.get(
        `https://graph.microsoft.com/v1.0/planner/plans?$filter=owner eq '${groupId}'`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(`Fetched plans for group ${groupId}:`, response.data);
      // 必要に応じて取得したプランを状態に保存する処理を追加
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  // プロジェクトにグループIDを連携させる関数
  const handleConnectGroup = async (projectId: number) => {
    const groupId = prompt('連携するグループIDを入力してください:');
    if (!groupId) return;

    // 入力されたグループIDを状態に保存
    setGroupLinks((prev) => ({ ...prev, [projectId]: groupId }));

    // オプション: グループIDに関連するプランを取得
    if (accessToken) {
      await fetchPlansByGroup(groupId, accessToken);
    }
  };

  const handleConnectBox = async (projectId: number) => {
    const folderId = prompt('連携するBoxフォルダIDを入力してください:');
    if (!folderId) return;

    try {
      // box.pyの PUT /api/box/connect/:project_id を呼び出す
      await axios.put(`http://127.0.0.1:8000/api/box/connect/${projectId}`, {
        folder_id: folderId,
      });
      alert('Boxフォルダがプロジェクトに連携されました。');
      fetchProjects(); // 再度プロジェクト一覧を取得して最新状態を反映
    } catch (error) {
      console.error('Error connecting Box folder:', error);
      alert('Boxフォルダの連携に失敗しました。');
    }
  };

  const handleDisconnectBox = async (projectId: number) => {
    if (!confirm('このプロジェクトからBoxフォルダを切断しますか？')) return;
    try {
      // box.pyの DELETE /api/box/disconnect/:project_id を呼び出す
      await axios.delete(`http://127.0.0.1:8000/api/box/disconnect/${projectId}`);
      alert('Boxフォルダがプロジェクトから切断されました。');
      fetchProjects();
    } catch (error) {
      console.error('Error disconnecting Box folder:', error);
      alert('Boxフォルダの切断に失敗しました。');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await initializeMsal();
      if (isMsalInitialized) {
        fetchAccessToken();
      }
    };

    initialize();
  }, [isMsalInitialized]);

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
    fetchProjects();
    fetchAllProjectFiles();
    fetchSlackChannels();
    fetchConnectedSlackChannels();
  }, []);

  // プロジェクト一覧を取得した後、Boxフォルダ情報を取得する
  useEffect(() => {
    async function fetchFolderInfo(project: Project) {
      if (project.box_folder_id) {
        try {
          const response = await axios.get<BoxFolderInfo>(`http://127.0.0.1:8000/api/box/folders/${project.box_folder_id}`);
          setBoxFolderInfos(prev => ({ ...prev, [project.id]: response.data }));
        } catch (error) {
          console.error(`Error fetching folder info for project ${project.id}:`, error);
          setBoxFolderInfos(prev => ({ ...prev, [project.id]: null }));
        }
      }
    }

    // プロジェクト一覧取得後に各プロジェクトのフォルダ情報を取得
    projects.forEach(project => {
      if (project.box_folder_id) {
        fetchFolderInfo(project);
      }
    });
  }, [projects]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get<Project[]>('http://127.0.0.1:8000/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('プロジェクトの取得に失敗しました。');
    }
  };

  const fetchAllProjectFiles = async () => {
    try {
      const response = await axios.get<UploadedFile[]>('http://127.0.0.1:8000/api/files/files');
      // Group files by project_id
      const groupedFiles: { [key: number]: UploadedFile[] } = {};
      response.data.forEach((file) => {
        if (!groupedFiles[file.project_id]) {
          groupedFiles[file.project_id] = [];
        }
        groupedFiles[file.project_id].push(file);
      });
      Object.entries(groupedFiles).forEach(([projectId, files]) => {
        setProjectFiles(Number(projectId), files);
      });
    } catch (error) {
      console.error('Error fetching project files:', error);
      alert('プロジェクトファイルの取得に失敗しました。');
    }
  };

  const fetchSlackChannels = async () => {
    try {
      const response = await axios.get<SlackChannel[]>('http://127.0.0.1:8000/api/slack/slack-channels');
      setSlackChannels(response.data);
    } catch (error) {
      console.error('Error fetching Slack channels:', error);
      // alert('Slackチャンネルの取得に失敗しました。');
    }
  };

  const fetchConnectedSlackChannels = async () => {
    try {
      const response = await axios.get<ProjectSlackLink[]>('http://127.0.0.1:8000/api/slack/project-slack-links');
      setConnectedSlackChannels(response.data);
    } catch (error) {
      console.error('Error fetching connected Slack channels:', error);
      alert('プロジェクトとSlackチャンネルの連携情報の取得に失敗しました。');
    }
  };

  const handleFileUpload = async (projectId: number, file: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId.toString());

    try {
      setUploadProgress((prev) => ({ ...prev, [projectId]: 0 }));
      const response = await axios.post<UploadedFile>(
        'http://127.0.0.1:8000/api/files/upload-file',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setUploadProgress((prev) => ({ ...prev, [projectId]: percentCompleted }));
          },
        }
      );
      // 更新されたファイルリストをプロジェクトに追加
      setProjectFiles(projectId, [...(projectFiles[projectId] || []), response.data]);
      alert('ファイルがアップロードされました。');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('ファイルのアップロードに失敗しました。');
    } finally {
      setUploadProgress((prev) => ({ ...prev, [projectId]: 0 }));
    }
  };

  const handleDownloadFile = (projectId: number, filename: string) => {
    const link = document.createElement('a');
    link.href = `http://127.0.0.1:8000/api/files/download-file/${projectId}/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteFile = async (projectId: number, filename: string) => {
    if (!confirm('このファイルを削除してもよろしいですか？')) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/files/delete-file/${projectId}/${filename}`);
      setProjectFiles(projectId, projectFiles[projectId].filter((file) => file.filename !== filename));
      alert('ファイルが削除されました。');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('ファイルの削除に失敗しました。');
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

  const handleConnectSlack = async (projectId: number) => {
    const slackChannelId = prompt('連携するSlackチャンネルのIDを入力してください:');
    if (!slackChannelId) return;

    const tag = prompt('このチャンネルに関連するタグを入力してください:') || "";

    try {
      await axios.put(`http://127.0.0.1:8000/api/projects/${projectId}/slack`, {
        channel_id: slackChannelId,
        tag: tag
      });
      alert('Slackチャンネルがプロジェクトに連携されました。');
      fetchProjects(); // 更新されたCSVを再取得して反映
    } catch (error) {
      console.error('Error connecting Slack channel:', error);
      alert('Slackチャンネルの連携に失敗しました。');
    }
  };

  const handleDisconnectSlack = async (projectId: number) => {
    if (!confirm('このプロジェクトからSlackチャンネルを切断しますか？')) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/projects/${projectId}/slack`);
      alert('Slackチャンネルがプロジェクトから切断されました。');
      fetchProjects();
    } catch (error) {
      console.error('Error disconnecting Slack channel:', error);
      alert('Slackチャンネルの切断に失敗しました。');
    }
  };

  // Assume `solutions` is managed elsewhere or omit if not relevant
  const [solutions, setSolutions] = useState<any[]>([]); // Update with actual type

  const filteredSolutions = solutions.filter((solution) =>
    solution.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* タイトル */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">設定</h1>
        <p>Access Token: {accessToken ? accessToken : '未取得'}</p>
      </div>

      {/* タブナビゲーション */}
      <div className="mb-6">
        <nav className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded ${activeTab === 'fileApi' ? 'bg-[#173241] text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('fileApi')}
          >
            ファイル・API管理
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === 'solution' ? 'bg-[#173241] text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('solution')}
          >
            ソリューション管理
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === 'masking' ? 'bg-[#173241] text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('masking')}
          >
            マスキング管理
          </button>
        </nav>
      </div>

      {/* コンテンツ */}
      {activeTab === 'fileApi' && (
        <div>
          {/* プロジェクトとSlackチャンネルの連携テーブル */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">ファイル管理・API連携</h2>
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">プロジェクト名</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Slack</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">タグ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Planner</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Box Folder</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">ファイル</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map((project) => {
                  const linkedSlack = connectedSlackChannels.find((link) => link.project_id === project.id);
                  const slackChannel = slackChannels.find((channel) => channel.id === project.slack_channel_id);
                  const files = projectFiles[project.id] || [];
                  const groupId = groupLinks[project.id];
                  const slackTag = project.slack_tag || "";
                  const folderInfo = boxFolderInfos[project.id];
                  const folderDisplayName = folderInfo ? folderInfo.name : project.box_folder_id || "未連携";

                  return (
                    <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-800">{project.customer_name}</td>
                      {/* Slackチャンネル */}
                      <td className="px-4 py-3 text-gray-800">
                        {slackChannel ? (
                          <div className="flex items-center space-x-2">
                            <span>{slackChannel.name}</span>
                            <button
                              onClick={() => handleConnectSlack(project.id)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              変更
                            </button>
                            <button
                              onClick={() => handleDisconnectSlack(project.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              解除
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConnectSlack(project.id)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            チャンネル連携
                          </button>
                        )}
                      </td>
                      {/* Slackタグ */}
                      <td className="px-4 py-3 text-gray-800">
                        {project.slack_tag ? (
                          <div className="flex items-center space-x-2">
                            <span>{project.slack_tag}</span>
                            <button
                              onClick={async () => {
                                const newTag = prompt('新しいタグを入力してください:', project.slack_tag);
                                if (newTag !== null) {
                                  try {
                                    // Slackチャンネルとタグを更新（変更可能なAPIエンドポイントを使用）
                                    await axios.put(`http://127.0.0.1:8000/api/projects/${project.id}/slack`, {
                                      channel_id: project.slack_channel_id,
                                      tag: newTag
                                    });
                                    alert('タグが更新されました。');
                                    fetchProjects();
                                  } catch (error) {
                                    console.error('Error updating tag:', error);
                                    alert('タグの更新に失敗しました。');
                                  }
                                }
                              }}
                              className="text-blue-500 hover:text-blue-700 text-sm"
                            >
                              変更
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={async () => {
                              const newTag = prompt('新しいタグを入力してください:');
                              if (newTag !== null) {
                                try {
                                  // Slackチャンネル未登録状態でタグ追加はできない前提（またはチャンネル登録済みでないとタグ変更できない場合）
                                  alert('チャンネルが未登録です。まずチャンネルを登録してください。');
                                } catch (error) {
                                  console.error('Error setting tag:', error);
                                  alert('タグの設定に失敗しました。');
                                }
                              }
                            }}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            タグ登録
                          </button>
                        )}
                      </td>
                      {/* Planner */}
                      <td className="px-4 py-3 text-gray-800">
                        {groupId ? (
                          <span>{groupId}</span>
                        ) : (
                          <button
                            onClick={() => handleConnectGroup(project.id)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            グループ連携
                          </button>
                        )}
                      </td>
                      {/* Boxフォルダ連携 */}
                      <td className="px-4 py-3 text-gray-800">
                        {project.box_folder_id ? (
                          <div className="flex items-center space-x-2">
                            <span>{folderDisplayName}</span>
                            <button
                              onClick={() => handleConnectBox(project.id)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              変更
                            </button>
                            <button
                              onClick={() => handleDisconnectBox(project.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              解除
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConnectBox(project.id)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            フォルダ連携
                          </button>
                        )}
                      </td>
                      {/* ファイル一覧 */}
                      <td className="px-4 py-3 text-center">
                        <details className="group relative">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            {files.length > 0 ? `${files.length} ファイル` : 'ファイルなし'}
                          </summary>
                          <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg z-10">
                            {files.length > 0 && (
                              <ul className="max-h-40 overflow-y-auto">
                                {files.map((file) => (
                                  <li key={file.filename} className="flex justify-between items-center px-4 py-2 hover:bg-gray-100">
                                    <span className="text-sm">{file.filename}</span>
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => handleDownloadFile(project.id, file.filename)}
                                        className="text-[#173241] hover:text-green-700"
                                        title="ダウンロード"
                                      >
                                        <Download className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteFile(project.id, file.filename)}
                                        className="text-red-500 hover:text-red-700"
                                        title="削除"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {/* ファイルアップロードフォームをここに配置 */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const target = e.target as typeof e.target & {
                                  file: { files: FileList };
                                };
                                const file = target.file.files[0];
                                if (file) {
                                  handleFileUpload(project.id, file);
                                }
                              }}
                              className="px-4 py-2 border-t border-gray-200"
                            >
                              <div className="flex items-center space-x-2">
                                <label
                                  htmlFor={`file-input-${project.id}`}
                                  className="cursor-pointer bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 text-xs"
                                >
                                  ファイル追加
                                </label>
                                <input
                                  type="file"
                                  name="file"
                                  id={`file-input-${project.id}`}
                                  className="hidden"
                                  accept=".txt,.docx"
                                />
                                {uploadProgress[project.id] > 0 && (
                                  <span className="text-xs text-gray-600">{uploadProgress[project.id]}%</span>
                                )}
                              </div>
                            </form>
                          </div>
                        </details>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'solution' && (
        <div>
          {/* Upload Section */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">ソリューション管理</h2>
            <div className="flex items-center space-x-4">
              <label className="cursor-pointer bg-[#CB6CE6] text-white px-4 py-2 rounded flex items-center hover:bg-[#D69292]">
                <Upload className="mr-2" />
                ファイルを選択
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".txt,.docx"
                />
              </label>
              <span className="text-sm text-gray-600">対応フォーマット: Text, Word</span>
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
      )}

      {activeTab === 'masking' && (
        <div>
          {/* マスキング管理コンテンツ */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">マスキング管理</h2>
            <p className="text-gray-700">ここにマスキング管理のコンテンツを追加します。</p>
            {/* 具体的なUIや機能はここに実装してください */}
          </div>
        </div>
      )}
    </div>
  );
}
