// src/frontend/app/components/ManageDocuments.tsx
'use client';

import React, { useEffect, useState } from 'react';
import useProjectStore from '../store/projectStore';
import useChatStore from '../store/chatStore';
import axios from 'axios';
import Select from 'react-select';
import { FaRobot, FaUser } from 'react-icons/fa';
import { Download, Trash2 } from 'lucide-react';

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
  } = useProjectStore();
  const { resetMessages } = useChatStore();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectionOptions, setSelectionOptions] = useState<SelectionOption[]>([]);
  const [selectedSource, setSelectedSource] = useState<SelectionOption | null>(null);

  useEffect(() => {
    fetchFiles();
    fetchSlackChannels();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await axios.get<UploadedFile[]>('http://127.0.0.1:8000/api/files/files');
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
      updateSelectionOptions(uploadedFiles, response.data);
    } catch (error) {
      console.error('Error fetching Slack channels:', error);
      alert('Slackチャンネルの取得に失敗しました。');
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

  const handleSourceSelect = (selectedOption: any) => {
    setSelectedSource(selectedOption);
    resetMessages(); // ソース変更時にチャット履歴をリセット
  };

  const handleDownloadFile = (filename: string) => {
    const link = document.createElement('a');
    link.href = `http://127.0.0.1:8000/api/files/files/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteFile = async (filename: string) => {
    if (!confirm('このファイルを削除してもよろしいですか？')) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/files/delete-file/${filename}`);
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
        <Select
          options={selectionOptions}
          onChange={handleSourceSelect}
          placeholder="ソースを選択してください（ファイルまたはSlackチャンネル）"
          isClearable
          value={selectedSource}
        />
      </div>

      {/* 選択されたソースの表示 */}
      {selectedSource && selectedSource.type === 'file' && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold">選択されたファイル: {selectedSource.label}</h3>
        </div>
      )}

      {selectedSource && selectedSource.type === 'slack' && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold">選択されたSlackチャンネル: {selectedSource.label}</h3>
        </div>
      )}

      {/* アップロードされたファイル一覧 */}
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-2">アップロードされたファイル</h3>
        <ul className="space-y-2">
          {uploadedFiles.map((file) => (
            <li key={file.filename} className="flex justify-between items-center bg-gray-100 p-2 rounded">
              <span>{file.filename}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownloadFile(file.filename)}
                  className="text-green-500 hover:text-green-700"
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

      {/* 連携されているSlackチャンネル一覧 */}
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-2">連携されているSlackチャンネル</h3>
        <ul className="space-y-2">
          {connectedSlackChannels.map((link) => {
            const channel = slackChannels.find((c) => c.id === link.slack_channel_id);
            const project = projects.find((p) => p.id === link.project_id);
            return (
              <li key={link.project_id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                <span>{project ? project.customer_name : 'Unknown Project'} - {channel ? channel.name : 'Unknown Channel'}</span>
                <button
                  onClick={() => handleDisconnectSlack(link.project_id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
