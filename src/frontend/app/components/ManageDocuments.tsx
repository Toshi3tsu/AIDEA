// src/frontend/app/components/ManageDocuments.tsx
'use client';

import React, { useEffect, useState } from 'react';
import useProjectStore from '../store/projectStore';
import axios from 'axios';
import { FolderSearch, ListTodo } from 'lucide-react';
import Select from 'react-select';
import ReactMarkdown from 'react-markdown';
import TaskExtractionModal from './TaskExtractionModal';
import { useRouter } from 'next/navigation';
import { UploadedFile, SlackChannel, SlackThread, SelectionOption, Task, ThreadsByTag, ManageDocumentsProps} from '../../types/document';

export default function ManageDocuments({ selectedProject }: ManageDocumentsProps) {
  // ... (rest of the component code as before)
  const {
    slackChannels,
    setSlackChannels,
    selectedSource,
    setSelectedSource,
    selectedUploadedFiles, // グローバルな選択されたファイルリスト
    selectedThreads,       // グローバルな選択されたスレッドリスト
    toggleFileSelection,   // グローバルなファイル選択トグル関数
    toggleThreadSelection, // グローバルなスレッド選択トグル関数
    setSelectedUploadedFiles, // 追加
    setSelectedThreads,
  } = useProjectStore();

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectionOptions, setSelectionOptions] = useState<SelectionOption[]>([]);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [documentText, setDocumentText] = useState<string>("");
  const [extractedTasks, setExtractedTasks] = useState<Task[]>([]);
  const [sending, setSending] = useState<boolean>(false);
  const [threadsByTag, setThreadsByTag] = useState<ThreadsByTag[]>([]);

  const router = useRouter();

  useEffect(() => {
    if (selectedProject) {
      // プロジェクトが切り替わった際、選択されたソースと内容をクリア
      setSelectedSource(null);
      setFileContent(null);

      // 既存の初期化処理
      setThreadsByTag([]);
      setUploadedFiles([]);

      setSelectedUploadedFiles([]);
      setSelectedThreads([]);
      console.log("selectedProject:", selectedProject);

      if (selectedProject.box_folder_id) {
        const folderPath = selectedProject.box_folder_id;
        console.log("folderPath (box_folder_id):", folderPath);
        console.log("fetchFilesFromBox を呼び出す (box_folder_id)");
        fetchFilesFromBox(folderPath);
      } else if (selectedProject.box_folder_path) {
        const folderPath = selectedProject.box_folder_path;
        console.log("folderPath (box_folder_path):", folderPath);
        console.log("fetchFilesFromBox を呼び出す (box_folder_path)");
        fetchFilesFromBox(folderPath);
      }
      fetchSlackChannels();
      autoSearchThreadsForTags();
    }
  }, [selectedProject]);

  // uploadedFiles または threadsByTag が更新された時に選択肢を更新
  useEffect(() => {
    updateSelectionOptions(uploadedFiles, threadsByTag);
  }, [uploadedFiles, threadsByTag]);

  const fetchFilesFromBox = async (folderPath: string) => {
    console.log("fetchFilesFromBox 関数が呼ばれました。folderPath:", folderPath);
    try {
      const baseDirectory = 'C:\\Users\\toshimitsu_fujiki\\Box';
      const fullFolderPath = baseDirectory ? `${baseDirectory}\\${folderPath}` : folderPath;
      console.log("fullFolderPath:", fullFolderPath);

      const projectId = selectedProject.id;
  
      // ローカルファイルパスからファイル一覧を取得する処理
      const response = await axios.post<UploadedFile[]>('http://127.0.0.1:8000/api/box/list-local-files', {
        folder_path: fullFolderPath, // 修正：/ をそのまま使う
        project_id: projectId,  // project_idをリクエストに追加
      });
      console.log("APIレスポンス (list-local-files):", response.data);
      setUploadedFiles(response.data);
    } catch (error) {
      console.error('Error fetching Box files:', error);
      alert('Boxフォルダ内のファイル取得に失敗しました。');
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

  const autoSearchThreadsForTags = async () => {
    if (!selectedProject?.slack_channel_id) {
      console.warn("Slackチャンネルが接続されていません。");
      return;
    }
    const tags = selectedProject.slack_tag ? selectedProject.slack_tag.split(',').map(tag => tag.trim()) : [];
    const results: ThreadsByTag[] = [];

    await Promise.all(tags.map(async (tag) => {
      try {
        const response = await axios.post<SlackThread[]>('http://127.0.0.1:8000/api/slack/search-messages', {
          channel_id: selectedProject.slack_channel_id,
          query: `#${tag}`,
        });
        results.push({ tag, threads: response.data });
      } catch (error) {
        console.error(`Error searching threads for tag ${tag}:`, error);
      }
    }));

    setThreadsByTag(results);
  };

  const updateSelectionOptions = (
    files: UploadedFile[],
    threadsData: ThreadsByTag[] = []
  ) => {
    const fileOptions: SelectionOption[] = files.map((file) => ({
      value: file.source_name,
      label: `（ファイル）${file.source_name}`,
      type: 'file',
    }));

    // 各タグのスレッドを選択肢に追加
    const threadOptions: SelectionOption[] = threadsData.flatMap(({ tag, threads }) =>
      threads.map(thread => ({
        value: thread.ts,
        label: `（スレッド：${tag}）${thread.text.substring(0, 40)}`,
        type: 'thread',
      }))
    );

    setSelectionOptions([...fileOptions, ...threadOptions]);
  };

  useEffect(() => {
    // fileContentが変更されたときに実行する処理
    if (fileContent) {
      console.log("Updated fileContent:", fileContent);
    }
  }, [fileContent]);

  const handleSourceSelect = async (selectedOption: SelectionOption | null) => {
    setSelectedSource(selectedOption);
    setFileContent(null);

    if (!selectedOption) return;

    setLoading(true);

    try {
        if (selectedOption.type === 'file') {
            const filename = selectedOption.value;
            const folderPath = selectedProject.box_folder_id || selectedProject.box_folder_path || "";
            const projectId = selectedProject.id;

            // バックエンドでテキスト抽出を行う
            const fileResponse = await axios.get(
                `http://127.0.0.1:8000/api/box/extract-text-from-file/${selectedProject.id}/${filename}`,
                {
                    params: { source_type: 'box', folder_path: folderPath },
                }
            );
            console.log("fileResponse.data.text:", fileResponse.data.text);
            setFileContent(fileResponse.data.text);
        } else if (selectedOption.type === 'thread') {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/slack/thread-messages`, {
                    params: {
                        channel_id: selectedProject?.slack_channel_id,
                        thread_ts: selectedOption.value,
                    }
                });
                setFileContent(response.data);
            } catch (error) {
                console.error('Error fetching thread content:', error);
                setFileContent(`スレッドの内容を取得できませんでした。\n\n${error}`);
            }
        }
    } catch (error) {
        console.error('Error fetching file content:', error);
        setFileContent(`ファイルの内容を取得できませんでした。\n\n${error}`);
    } finally {
        setLoading(false);
    }
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

  const handleProblemExtraction = () => {
  };

  const handleTaskExtraction = async () => {
    setSending(true);

    let docText = "";
    if (selectedSource && selectedSource.type === 'file') { // 選択されたソースの内容を使用
      docText = fileContent || ""; // fileContent が null の場合を考慮
      setDocumentText(docText);
    } else {
      alert("タスク抽出を実行するにはファイルを選択してください。");
      setSending(false);
      return;
    }


    try {
      const extractionResponse = await axios.post('http://127.0.0.1:8000/api/task/extract-tasks', {
        document_text: docText,
      });
      setExtractedTasks(extractionResponse.data.tasks);
    } catch (error) {
      console.error('Error extracting tasks:', error);
    }

    setShowTaskModal(true);
    setSending(false);
  };

  const handleModalCancel = () => {
    setShowTaskModal(false);
  };

  const handleTaskLink = (tasks: Task[]) => {
    router.push('/project-management');
  };

  return (
    <div className="h-full flex flex-col">
      {/* 上部固定エリア：ソース選択＆内容確認 */}
      <div className="flex-shrink-0 p-4">
        {showTaskModal && (
          <TaskExtractionModal
            documentText={documentText}
            extractedTasks={extractedTasks}
            onCancel={handleModalCancel}
            onTaskLink={handleTaskLink}
          />
        )}

        {/* ソース選択エリア */}
        <div className="flex mb-0 items-center">
          <div className="flex items-center justify-end space-x-4 mb-4">
            {/* <h3 className="mb-1 text-lg font-semibold">ファイルの内容確認:</h3>
            <button
              onClick={handleProblemExtraction}
              className={`px-4 py-2 mb-1 text-white rounded ${
                sending
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#CB6CE6] hover:bg-[#A94CCB]'
              }`}
              disabled={sending}
            >
              {sending ? (
                <div className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>処理中...</span>
                </div>
              ) : (
                '課題抽出'
              )}
            </button> */}
          </div>
          <FolderSearch className="h-8 w-8 mr-2 text-gray-600" />
          <Select
            options={selectionOptions}
            onChange={handleSourceSelect}
            placeholder="確認したいソースを選択してください"
            isClearable
          />
          <button
            onClick={handleTaskExtraction}
            className={`ml-4 px-4 py-2 mb-1 bg-[#CB6CE6] text-white rounded ${
              sending || !selectedSource
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-[#A94CCB]'
            }`}
            disabled={sending || !selectedSource}
            title={!selectedSource ? "確認中のソースからタスクを抽出する" : ""} // ツールチップテキストを追加
          >
            {sending ? (
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>処理中...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <ListTodo className="h-5 w-5" />
              </div>
            )}
          </button>
        </div>

        {/* ソース内容確認エリア（スクロールせず内容は全て表示） */}
        {selectedSource && (selectedSource.type === 'file' || selectedSource.type === 'thread') && (
          <div className="mb-4">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <svg className="animate-spin h-8 w-8 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span className="ml-2 text-sm text-gray-600">読み込み中...</span>
              </div>
            ) : fileContent ? (
              <div className="p-4 bg-white rounded border overflow-y-auto text-xs" style={{ maxHeight: '300px', whiteSpace: 'pre-wrap' }}>
                <ReactMarkdown>{fileContent}</ReactMarkdown>
              </div>
            ) : (
              <p className="p-4 text-gray-500">ソースの内容はありません。</p>
            )}
          </div>
        )}

        {selectedSource && selectedSource.type === 'slack' && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold">選択されたSlackチャンネル: {selectedSource.label}</h3>
          </div>
        )}
      </div>

      {/* 下部スクロール可能エリア：タグごとのスレッド一覧とアップロードされたファイル一覧 */}
      <div className="bg-white flex-grow overflow-y-auto px-4 pb-4">
        {/* タグごとのスレッド一覧 */}
        <div className="mt-6">
          <div className="flex items-center mb-2">
            <img src="/Slack_logo.png" alt="Slack Logo" className="w-8 h-8 mr-2 self-center" />
            <h3 className="text-xl font-semibold">タグごとのスレッド一覧</h3>
          </div>
          {threadsByTag.map(({ tag, threads }) => (
            <div key={tag} className="mb-6">
              <h3 className="text-lg font-semibold mb-2">「{tag}」タグ</h3>
              {threads.length > 0 ? (
                <ul className="space-y-2">
                  {threads.map((thread) => (
                    <li key={thread.ts} className="flex items-center bg-gray-100 p-2 rounded">
                      <input
                        type="checkbox"
                        className="mr-2 w-4 h-4 flex-shrink-0"
                        checked={selectedThreads.includes(thread.ts)}
                        onChange={() => toggleThreadSelection(thread.ts)}
                      />
                      <div>
                        <strong>{thread.text.substring(0, 40)}</strong>
                        <p className="text-sm text-gray-600">作成者: {thread.user}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">該当するスレッドはありません。</p>
              )}
            </div>
          ))}
        </div>

        {/* Boxファイル一覧 */}
        <div className="mt-6">
          <div className="flex items-center mb-2">
            <img src="/Box_logo.svg" alt="Box Logo" className="w-8 h-8 mr-2 self-center" />
            <h3 className="text-xl font-semibold">ファイル一覧</h3>
          </div>
          <ul className="space-y-2">
            {uploadedFiles.map((file) => (
              <li key={file.id} className="flex items-center bg-gray-100 p-2 rounded">
                {file.processed ? ( // processed が true の場合のみチェックボックスを表示
                  <input
                    type="checkbox"
                    className="mr-2 w-4 h-4 flex-shrink-0"
                    checked={selectedUploadedFiles.includes(file.source_name)}
                    onChange={() => toggleFileSelection(file.source_name)}
                  />
                ) : (
                  <div className="mr-2 w-4 h-4 flex-shrink-0"></div> // processed が false の場合はチェックボックスを表示しない
                )}
                <span>{file.source_name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}