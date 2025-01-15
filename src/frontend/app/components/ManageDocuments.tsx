// src/frontend/app/components/ManageDocuments.tsx
'use client';

import React, { useEffect, useState } from 'react';
import useProjectStore from '../store/projectStore';
import useChatStore from '../store/chatStore';
import axios from 'axios';
import Select from 'react-select';
import { Download, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface UploadedFile {
  filename: string;
  filepath: string;
}

interface SlackChannel {
  id: string;
  name: string;
}

interface SelectionOption {
  value: string;
  label: string;
  type: 'file' | 'slack';
}

export default function ManageDocuments() {
  const {
    projects,
    setProjects,
    slackChannels,
    setSlackChannels,
    connectedSlackChannels,
    setConnectedSlackChannels,
    selectedSource,
    selectedProject,
    setSelectedSource,
  } = useProjectStore();

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectionOptions, setSelectionOptions] = useState<SelectionOption[]>([]);
  const [fileContent, setFileContent] = useState<string | null>(null);
  
  useEffect(() => {
    // プロジェクトが選択されているときに、そのプロジェクトに関連するファイルとSlackチャンネルを更新
    if (selectedProject) {
      fetchFilesForProject(selectedProject.id);
      fetchSlackChannels();
    }
  }, [selectedProject]);  // selectedProjectの変化を監視

  const fetchFilesForProject = async (projectId: number) => {
    try {
      const response = await axios.get<UploadedFile[]>(`http://127.0.0.1:8000/api/files/files/${projectId}`);
      setUploadedFiles(response.data);
      updateSelectionOptions(response.data, slackChannels);
    } catch (error) {
      console.error('Error fetching files:', error);
      alert('ファイルの取得に失敗しました。');
    }
  };

  const fetchSlackChannels = async () => {
    try {
      const response = await axios.get<SlackChannel[]>('http://127.0.0.1:8000/api/slack/slack-channels');
      setSlackChannels(response.data);
      // selectionOptionsの更新はfetchFilesForProject内で実施
    } catch (error) {
      console.error('Error fetching Slack channels:', error);
      // alert('Slackチャンネルの取得に失敗しました。');
    }
  };

  const updateSelectionOptions = (files: UploadedFile[], channels: SlackChannel[]) => {
    const fileOptions: SelectionOption[] = files.map((file) => ({
      value: file.filename,
      label: `${file.filename} (ファイル)`,
      type: 'file',
    }));
    const slackOptions: SelectionOption[] = channels.map((channel) => ({
      value: channel.id,
      label: `${channel.name} (Slack)`,
      type: 'slack',
    }));
    setSelectionOptions([...fileOptions, ...slackOptions]);
  };

  const handleSourceSelect = async (selectedOption: SelectionOption | null) => {
    setSelectedSource(selectedOption);
    setFileContent(null);

    // ファイルが選択された場合、その内容を取得
    if (selectedOption?.type === 'file') {
      try {
        const fileResponse = await axios.get(
          `http://127.0.0.1:8000/api/files/download-file/${selectedProject.id}/${selectedOption.value}`,
          { responseType: 'text' }
        );
        setFileContent(fileResponse.data); // ファイルの内容を保存
      } catch (error) {
        console.error('Error fetching file content:', error);
        alert('ファイルの内容を取得できませんでした。');
      }
    }
  };

  const handleDownloadFile = (filename: string) => {
    const link = document.createElement('a');
    link.href = `http://127.0.0.1:8000/api/files/download-file/${selectedProject.id}/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteFile = async (filename: string) => {
    if (!selectedProject) return;
    if (!confirm('このファイルを削除してもよろしいですか？')) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/files/delete-file/${selectedProject.id}/${filename}`);
      setUploadedFiles(uploadedFiles.filter((file) => file.filename !== filename));
      updateSelectionOptions(uploadedFiles.filter((file) => file.filename !== filename), slackChannels);
      alert('ファイルが削除されました。');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('ファイルの削除に失敗しました。');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">ドキュメント管理</h2>

      {/* ソース選択ドロップダウン */}
      <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">ファイルの内容確認:</h3>
        <Select
          options={selectionOptions}
          onChange={handleSourceSelect}
          placeholder="ソースを選択してください（ファイルまたはSlackチャンネル）"
          isClearable
        />
      </div>

      {/* 選択されたソースの内容表示 */}
      {selectedSource && selectedSource.type === 'file' && fileContent && (
        <div className="mb-4">
          <div
            className="p-4 bg-white rounded border overflow-y-auto"
            style={{ maxHeight: '500px', whiteSpace: 'pre-wrap' }}
          >
            <ReactMarkdown>{fileContent}</ReactMarkdown>
          </div>
        </div>
      )}

      {selectedSource && selectedSource.type === 'slack' && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold">選択されたSlackチャンネル: {selectedSource.label}</h3>
        </div>
      )}

      {/* アップロードされたファイル一覧 */}
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-2">アップロードされたファイル一覧</h3>
        <ul className="space-y-2">
          {uploadedFiles.map((file) => (
            <li key={file.filename} className="flex justify-between items-center bg-gray-100 p-2 rounded">
              <span>{file.filename}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownloadFile(file.filename)}
                  className="text-[#173241] hover:text-green-700"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteFile(file.filename)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
