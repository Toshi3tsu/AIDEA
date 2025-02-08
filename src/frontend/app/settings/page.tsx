// src/frontend/app/settings/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { Upload, Edit2, Trash2, Search, Download, Settings as SettingsIcon, ChevronUp, ChevronDown } from 'lucide-react';
import useFlowStore from '../store/flowStore';
import useProjectStore from '../store/projectStore';
import axios from 'axios';
import msalInstance from '../config/msalInstance';
import ReactDOM from 'react-dom/client';
import ProjectList from '../components/ProjectList';

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
  box_folder_id: string;
  box_folder_path: string;
  schedule: string;
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

export default function SettingsPage() {
  useEffect(() => {
    document.querySelector('.page-title')!.textContent = '設定';
    const iconContainer = document.querySelector('.page-icon')!;
    iconContainer.innerHTML = '';
    const icon = document.createElement('div');
    const root = ReactDOM.createRoot(icon);
    root.render(<SettingsIcon className="h-5 w-5" />);
    iconContainer.appendChild(icon);
  }, []);
  const { generatedFlow, setGeneratedFlow } = useFlowStore();
  const { projects, setProjects, slackChannels, setSlackChannels, 
    connectedSlackChannels, setConnectedSlackChannels, projectFiles, setProjectFiles, } = useProjectStore();
  const [boxFolderInfos, setBoxFolderInfos] = useState<{ [projectId: number]: BoxFolderInfo | null }>({});
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSolution, setEditingSolution] = useState(null);
  const [activeTab, setActiveTab] = useState<'fileApi' | 'solution' | 'masking' | 'projectList' | 'newsKeywords'>('fileApi');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isMsalInitialized, setIsMsalInitialized] = useState(false);
  const [groupLinks, setGroupLinks] = useState<{ [projectId: number]: string }>({});
  const [solutions, setSolutions] = useState<any[]>([]);
  const [newsKeywords, setNewsKeywords] = useState<string[]>([]); // 初期値を空の配列に変更
  const [newKeyword, setNewKeyword] = useState('');
  const [isPathModalOpen, setIsPathModalOpen] = useState(false);
  const [relativePath, setRelativePath] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // 新たに追加: グローバルベースディレクトリの状態
  const [baseDirectory, setBaseDirectory] = useState<string>('');
  const [isBaseDirModalOpen, setIsBaseDirModalOpen] = useState<boolean>(false);
  const [newBaseDirectoryInput, setNewBaseDirectoryInput] = useState<string>('');

  const fetchProjects = async () => {
    try {
      const response = await axios.get<Project[]>('http://127.0.0.1:8000/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('プロジェクトの取得に失敗しました。');
    }
  };

  useEffect(() => {
    const fetchInitialKeywords = async () => {
      try {
        const response = await axios.get<string[]>('http://127.0.0.1:8000/api/news/keywords');
        setNewsKeywords(response.data);
      } catch (error) {
        console.error('Failed to fetch keywords:', error);
        // APIからの取得に失敗した場合、ローカルストレージから読み込むか、初期値を設定
        const storedKeywords = localStorage.getItem('newsKeywords');
        if (storedKeywords) {
          setNewsKeywords(JSON.parse(storedKeywords));
        } else {
          setNewsKeywords(['DX']); // ローカルストレージにもない場合は初期値を設定
        }
      }
    };

    fetchInitialKeywords();
    fetchProjects();

    // グローバルベースディレクトリを取得
    const fetchBaseDirectory = async () => {
      try {
        const response = await axios.get<{ box_base_directory: string }>('http://127.0.0.1:8000/api/box/base-directory');
        setBaseDirectory(response.data.box_base_directory);
      } catch (error) {
        console.error('Failed to fetch base directory:', error);
        setBaseDirectory('');
      }
    };

    fetchBaseDirectory();
  }, []);

  useEffect(() => {
    localStorage.setItem('newsKeywords', JSON.stringify(newsKeywords));
  }, [newsKeywords]);

  const handleAddKeyword = async () => {
    if (newKeyword && !newsKeywords.includes(newKeyword)) {
      const updatedKeywords = [...newsKeywords, newKeyword];
      try {
        await axios.post('http://127.0.0.1:8000/api/news/keywords', updatedKeywords);
        setNewsKeywords(updatedKeywords);
        setNewKeyword('');
      } catch (error) {
        console.error('Failed to add keyword:', error);
      }
    }
  };

  const handleDeleteKeyword = async (keywordToDelete: string) => {
    const updatedKeywords = newsKeywords.filter(keyword => keyword !== keywordToDelete);
    try {
      await axios.post('http://127.0.0.1:8000/api/news/keywords', updatedKeywords);
      setNewsKeywords(updatedKeywords);
    } catch (error) {
      console.error('Failed to delete keyword:', error);
    }
  };

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

  const handleSetRelativePath = async () => {
    if (selectedProjectId === null) return;
    if (!relativePath) {
      alert('相対パスを入力してください。');
      return;
    }
    // ベースディレクトリが設定されているか確認
    if (!baseDirectory) {
      alert('ベースディレクトリが設定されていません。');
      return;
    }

    try {
      await axios.put(`http://127.0.0.1:8000/api/box/connect/${selectedProjectId}`, {
        folder_path: relativePath,
      });
      alert(`Boxフォルダ「${baseDirectory}/${relativePath}」がプロジェクトに連携されました。`);
      setIsPathModalOpen(false);
      setRelativePath('');
      await fetchProjects();
    } catch (error) {
      console.error("Error setting Box folder path:", error);
      if (axios.isAxiosError(error) && error.response) {
        alert(`エラー: ${JSON.stringify(error.response.data)}`); // 詳細なエラーメッセージを表示
      } else {
        alert("Boxフォルダの連携に失敗しました。");
      }
    }
  };

  const handleConnectBox = (projectId: number) => {
    // モーダルを開いてフルパスを入力させる
    setSelectedProjectId(projectId);
    setIsPathModalOpen(true);
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
      if (axios.isAxiosError(error) && error.response) {
        alert(`エラー: ${JSON.stringify(error.response.data)}`);
      } else {
        alert('Boxフォルダの切断に失敗しました。');
      }
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
    fetchSlackChannels();
    fetchConnectedSlackChannels();
  }, []);

  // プロジェクト一覧を取得した後、Boxフォルダ情報を取得する
  useEffect(() => {
    async function fetchFolderInfo(project: Project) {
      if (project.box_folder_id || project.box_folder_path) { // box_folder_path もチェック
        try {
          // API経由のフォルダ情報取得はコメントアウトのまま
          // setBoxFolderInfos(prev => ({ ...prev, [project.id]: { id: project.box_folder_id, name: project.box_folder_id } }));
          setBoxFolderInfos(prev => ({
            ...prev,
            [project.id]: {
              id: project.box_folder_id || project.box_folder_path, // box_folder_path を使用
              name: project.box_folder_path || project.box_folder_id // box_folder_path を優先
            }
          }));
        } catch (error) {
          console.error(`Error fetching folder info for project ${project.id}:`, error);
          setBoxFolderInfos(prev => ({ ...prev, [project.id]: null }));
        }
      } else {
        setBoxFolderInfos(prev => ({ ...prev, [project.id]: null })); // box_folder_id, box_folder_path がない場合は null を設定
      }
    }

    // プロジェクト一覧取得後に各プロジェクトのフォルダ情報を取得
    projects.forEach(project => {
      fetchFolderInfo(project);
    });
  }, [projects]);

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

  const filteredSolutions = solutions.filter((solution) =>
    solution.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // キーワードを上に移動する関数
  const handleMoveKeywordUp = async (index: number) => {
    if (index > 0) {
      const newKeywords = [...newsKeywords];
      const temp = newKeywords[index];
      newKeywords[index] = newKeywords[index - 1];
      newKeywords[index - 1] = temp;
      setNewsKeywords(newKeywords);
      try {
        await axios.post('http://127.0.0.1:8000/api/news/keywords', newKeywords);
      } catch (error) {
        console.error('Failed to update keywords:', error);
      }
    }
  };

  // キーワードを下に移動する関数
  const handleMoveKeywordDown = async (index: number) => {
    if (index < newsKeywords.length - 1) {
      const newKeywords = [...newsKeywords];
      const temp = newKeywords[index];
      newKeywords[index] = newKeywords[index + 1];
      newKeywords[index + 1] = temp;
      setNewsKeywords(newKeywords);
      try {
        await axios.post('http://127.0.0.1:8000/api/news/keywords', newKeywords);
      } catch (error) {
        console.error('Failed to update keywords:', error);
      }
    }
  };

  const activeProjects = projects.filter(project => !project.is_archived);

  // グローバルベースディレクトリ設定コンポーネント
  const GlobalBaseDirectory = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <h2 className="text-xl font-semibold mb-4">ベースディレクトリ設定</h2>
        <div className="flex items-center space-x-4">
          <span className="text-gray-700">現在のベースディレクトリ:</span>
          <span className="font-mono text-gray-800">{baseDirectory || "未設定"}</span>
          <button
            onClick={() => {
              setNewBaseDirectoryInput(baseDirectory);
              setIsBaseDirModalOpen(true);
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            変更
          </button>
        </div>

        {/* ベースディレクトリ変更モーダル */}
        {isBaseDirModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-xl font-semibold mb-4">ベースディレクトリを変更</h2>
              <input
                type="text"
                value={newBaseDirectoryInput}
                onChange={(e) => setNewBaseDirectoryInput(e.target.value)}
                placeholder="/path/to/box/base/directory"
                className="w-full p-2 border border-gray-300 rounded mb-4"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsBaseDirModalOpen(false);
                    setNewBaseDirectoryInput('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveBaseDirectory}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // グローバルベースディレクトリ保存ハンドラ
  const handleSaveBaseDirectory = async () => {
    if (!(newBaseDirectoryInput.startsWith('/') || /^[A-Za-z]:\//.test(newBaseDirectoryInput))) {
      alert('ベースディレクトリは絶対パスで入力してください。');
      return;
    }
  
    // Windowsパスの場合、先頭に '/' を追加
    let normalizedPath = newBaseDirectoryInput;
    if (process.platform === 'win32' && !newBaseDirectoryInput.startsWith('/')) {
      normalizedPath = '/' + newBaseDirectoryInput;
    }
  
    try {
      await axios.put('http://127.0.0.1:8000/api/box/base-directory', {
        new_base_directory: normalizedPath,
      });
      alert('ベースディレクトリが更新されました。');
      setBaseDirectory(normalizedPath);
      setIsBaseDirModalOpen(false);
      setNewBaseDirectoryInput('');
    } catch (error) {
      console.error('Error setting base directory:', error);
      if (axios.isAxiosError(error) && error.response) {
        alert(`エラー: ${error.response.data.detail}`);
      } else {
        alert('ベースディレクトリの設定に失敗しました。');
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* タイトル */}
      <div className="flex justify-between items-center mb-6">
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
          <button
            className={`px-4 py-2 rounded ${activeTab === 'projectList' ? 'bg-[#173241] text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('projectList')} // activeTab を 'projectList' に変更
          >
            プロジェクト一覧
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === 'newsKeywords' ? 'bg-[#173241] text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('newsKeywords')}
          >
            ニュースキーワード設定
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeProjects.map((project) => {
                  const linkedSlack = connectedSlackChannels.find((link) => link.project_id === project.id);
                  const slackChannel = slackChannels.find((channel) => channel.id === project.slack_channel_id);
                  const files = projectFiles[project.id] || [];
                  const groupId = groupLinks[project.id];
                  const slackTag = project.slack_tag || "";
                  const folderInfo = boxFolderInfos[project.id];

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
                        {project.box_folder_path ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs">{project.box_folder_path}</span>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* グローバルベースディレクトリ設定コンポーネント */}
          <GlobalBaseDirectory />
        </div>
      )}

      {/* 相対パス入力モーダル */}
      {isPathModalOpen && selectedProjectId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Boxフォルダの相対パスを入力</h2>
            <input
              type="text"
              value={relativePath}
              onChange={(e) => setRelativePath(e.target.value)}
              placeholder="relative/path/to/folder"
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsPathModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                キャンセル
              </button>
              <button
                onClick={handleSetRelativePath}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                連携
              </button>
            </div>
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

      {activeTab === 'projectList' && ( // activeTab を 'projectList' に変更
        <div>
          <ProjectList /> {/* コンポーネント名を ProjectList に変更 */}
        </div>
      )}

      {activeTab === 'newsKeywords' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">ニュースキーワード設定</h2>
          <div className="mb-4">
            <label htmlFor="new-keyword" className="block text-gray-700 text-sm font-bold mb-2">
              キーワードを追加:
            </label>
            <div className="flex">
              <input
                type="text"
                id="new-keyword"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                placeholder="新しいキーワードを入力"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
              />
              <button
                className="px-4 py-2 bg-[#173241] text-white font-semibold rounded hover:bg-[#0F2835] focus:outline-none focus:shadow-outline"
                type="button"
                onClick={handleAddKeyword}
              >
                追加
              </button>
            </div>
          </div>

          {/* キーワードリスト (順番入れ替え機能付き) */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">登録済みキーワード</h3>
            <ul>
              {newsKeywords.map((keyword, index) => ( // index を map 関数に追加
                <li key={keyword} className="flex justify-between items-center px-4 py-2 border rounded mb-2">
                  <div className="flex items-center">
                    <span className="mr-4">{keyword}</span>
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleMoveKeywordUp(index)}
                        className="p-1 hover:bg-gray-200 rounded-full focus:outline-none"
                        disabled={index === 0} // 先頭の場合は disabled
                      >
                        <ChevronUp className="h-4 w-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => handleMoveKeywordDown(index)}
                        className="p-1 hover:bg-gray-200 rounded-full focus:outline-none"
                        disabled={index === newsKeywords.length - 1} // 末尾の場合は disabled
                      >
                        <ChevronDown className="h-4 w-4 text-gray-700" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteKeyword(keyword)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-700"
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// グローバルベースディレクトリ設定コンポーネント
const GlobalBaseDirectory = () => {
  const [isBaseDirModalOpen, setIsBaseDirModalOpen] = useState<boolean>(false);
  const [newBaseDirectoryInput, setNewBaseDirectoryInput] = useState<string>('');
  const [baseDirectory, setBaseDirectory] = useState<string>('');

  useEffect(() => {
    const fetchBaseDirectory = async () => {
      try {
        const response = await axios.get<{ box_base_directory: string }>('http://127.0.0.1:8000/api/box/base-directory');
        setBaseDirectory(response.data.box_base_directory);
      } catch (error) {
        console.error('Failed to fetch base directory:', error);
        setBaseDirectory('');
      }
    };

    fetchBaseDirectory();
  }, []);

  const handleSaveBaseDirectory = async () => {
    if (!newBaseDirectoryInput.startsWith('/')) {
      alert('ベースディレクトリは絶対パスで入力してください。');
      return;
    }
    try {
      await axios.put('http://127.0.0.1:8000/api/box/base-directory', newBaseDirectoryInput);
      alert('ベースディレクトリが更新されました。');
      setBaseDirectory(newBaseDirectoryInput);
      setIsBaseDirModalOpen(false);
      setNewBaseDirectoryInput('');
      // プロジェクトのファイル一覧を再取得
      // fetchProjects関数を使用するため、グローバルステートやコンテキストを活用する必要があります。
      // ここでは簡略化のため、ページ全体をリロードします。
      window.location.reload();
    } catch (error) {
      console.error('Error setting base directory:', error);
      alert('ベースディレクトリの設定に失敗しました。');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">ベースディレクトリ設定</h2>
      <div className="flex items-center space-x-4">
        <span className="text-gray-700">現在のベースディレクトリ:</span>
        <span className="font-mono text-gray-800">{baseDirectory || "未設定"}</span>
        <button
          onClick={() => {
            setNewBaseDirectoryInput(baseDirectory);
            setIsBaseDirModalOpen(true);
          }}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          変更
        </button>
      </div>

      {/* ベースディレクトリ変更モーダル */}
      {isBaseDirModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">ベースディレクトリを変更</h2>
            <input
              type="text"
              value={newBaseDirectoryInput}
              onChange={(e) => setNewBaseDirectoryInput(e.target.value)}
              placeholder="/path/to/box/base/directory"
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsBaseDirModalOpen(false);
                  setNewBaseDirectoryInput('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveBaseDirectory}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};