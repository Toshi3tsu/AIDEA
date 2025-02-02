// src/frontend/app/components/ManageDocuments.tsx
'use client';

import React, { useEffect, useState } from 'react';
import useProjectStore from '../store/projectStore';
import axios from 'axios';
import Select from 'react-select';
import { Download, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import TaskExtractionModal from './TaskExtractionModal';
import { useRouter } from 'next/navigation';

// ... (interfaces and Props as before)

interface UploadedFile {
  filename: string;
  filepath: string;
}

interface SlackChannel {
  id: string;
  name: string;
}

interface SlackThread {
  ts: string;
  text: string;
  user: string;
}

interface SelectionOption {
  value: string;
  label: string;
  type: 'file' | 'slack' | 'thread';
}

interface Task {
  title: string;
  tag: '新規作成' | '更新' | 'クローズ' | '無視';
  assignee: string;  // 担当者名
  due_date: string;  // 期限
  detail: string;    // 詳細
}

interface ThreadsByTag {
  tag: string;
  threads: SlackThread[];
}

interface Props {
  selectedProject: any;
}


const boxnoteJsonToMarkdown = (json: any): string => {
  if (!json || !json.doc || !json.doc.content) {
    return '';
  }

  const processContent = (content: any[]): string => {
    let markdown = '';
    if (!Array.isArray(content)) {
      return markdown; // Return empty string if content is not an array
    }
    for (const node of content) {
      switch (node.type) {
        case 'heading':
          markdown += `${'#'.repeat(node.attrs.level)} ${processInlineContent(node.content)}\n`;
          break;
        case 'paragraph':
          // paragraph が中身を持っている場合のみ出力。中身が無い場合は改行のみとする
          if (node.content) {
            markdown += `${processInlineContent(node.content)}\n\n`;
          } else {
            markdown += '\n';
          }
          break;
        case 'bullet_list':
          markdown += processList(node.content, '* ');
          break;
        case 'ordered_list':
          markdown += processList(node.content, '1. ');
          break;
        case 'list_item':
          markdown += processContent(node.content);
          break;
        case 'horizontal_rule':
          markdown += '---\n';
          break;
        case 'text':
          markdown += processText(node);
          break;
        case 'hard_break':
          markdown += '\n';
          break;
        case 'image':
          markdown += `![${node.attrs.alt || 'image'}](${node.attrs.src || node.attrs.boxSharedLink})\n`;
          break;
        case 'embed':
          markdown += `[${node.attrs.title}](${node.attrs.url})\n`;
          break;
        case 'doc':
          markdown += processContent(node.content);
          break;
        default:
          console.warn('Unknown node type:', node.type);
          markdown += processContent(node.content || []); // Process content in case of unknown node
      }
    }
    return markdown;
  };

  const processInlineContent = (content: any): string => { // content can be any now
    let inlineMarkdown = '';
    if (!Array.isArray(content)) {
      return inlineMarkdown; // Return empty string if content is not an array
    }
    for (const node of content) {
      if (node.type === 'text') {
        inlineMarkdown += processText(node);
      } else if (node.type === 'hard_break') {
        inlineMarkdown += '\n';
      } else if (node.type === 'image') {
        inlineMarkdown += `![${node.attrs.alt || 'image'}](${node.attrs.src || node.attrs.boxSharedLink})`;
      } else if (node.type === 'embed') {
        inlineMarkdown += `[${node.attrs.title}](${node.attrs.url})`;
      }
    }
    return inlineMarkdown;
  };


  const processText = (node: any): string => {
    let text = node.text || '';
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === 'strong') {
          text = `**${text}**`;
        } else if (mark.type === 'highlight') {
          text = `<mark style="background-color: ${mark.attrs.color}">${text}</mark>`; // Or use simple emphasis if highlight is not well supported in your markdown renderer
        }
        // Ignore other marks like author_id, font_color for basic markdown rendering
      }
    }
    return text;
  };


  const processList = (content: any[], prefix: string): string => {
    let listMarkdown = '';
    let index = 1;
    if (!Array.isArray(content)) {
      return listMarkdown;
    }
    for (const item of content) {
      if (item.type === 'list_item') {
        const currentPrefix = prefix === '1. ' ? `${index}. ` : prefix;
        // リスト項目の中身を取得
        let itemContent = processContent(item.content);
        // 改行・余分な空白をスペースに置換して1行にまとめる
        itemContent = itemContent.replace(/\n+/g, ' ').trim();
        listMarkdown += `${currentPrefix}${itemContent}\n`;
        if (prefix === '1. ') {
          index++;
        }
      }
    }
    // リストの後に1行空ける
    listMarkdown += '\n';
    return listMarkdown;
  };

  if (json && json.doc && Array.isArray(json.doc.content)) {
    return processContent(json.doc.content);
  } else if (Array.isArray(json)) {
    return processContent(json);
  }
  return '';
};


export default function ManageDocuments({ selectedProject }: Props) {
  // ... (rest of the component code as before)
  const {
    slackChannels,
    setSlackChannels,
    selectedSource,
    setSelectedSource,
    baseDirectory,
  } = useProjectStore();

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectionOptions, setSelectionOptions] = useState<SelectionOption[]>([]);
  const [fileContent, setFileContent] = useState<string | null>(null);
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
      fetchFilesForProject(selectedProject.id);
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
      // API経由のファイル取得をコメントアウト
      // const response = await axios.get<UploadedFile[]>(`http://127.0.0.1:8000/api/box/folders/${folderId}/files`);
      // setUploadedFiles(response.data);

      const baseDirectory = 'C:\\Users\\toshimitsu_fujiki\\Box';
      const fullFolderPath = baseDirectory ? `${baseDirectory}/${folderPath}` : folderPath;
      // ローカルファイルパスからファイル一覧を取得する処理
      const response = await axios.post<UploadedFile[]>('http://127.0.0.1:8000/api/box/list-local-files', {
        folder_path: fullFolderPath.replace(/\//g, '\\'), // ★ / を \ に置換
      });
      setUploadedFiles(response.data);
    } catch (error) {
      console.error('Error fetching Box files:', error);
      alert('Boxフォルダ内のファイル取得に失敗しました。');
    }
  };

  const fetchFilesForProject = async (projectId: number) => {
    try {
      const response = await axios.get<UploadedFile[]>(`http://127.0.0.1:8000/api/files/files/${projectId}`);
      setUploadedFiles(prevFiles => {
        const newFiles = response.data.filter(newFile =>
          !prevFiles.some(prevFile => prevFile.filename === newFile.filename)
        );
        return [...prevFiles, ...newFiles];
      });
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
      value: file.filename,
      label: `（ファイル）${file.filename}`,
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

  const handleSourceSelect = async (selectedOption: SelectionOption | null) => {
    setSelectedSource(selectedOption);
    setFileContent(null);

    if (selectedOption?.type === 'file') {
      const filename = selectedOption.value;
      const fileExtension = filename.split('.').pop() || '';
      const folderPath = selectedProject.box_folder_id || selectedProject.box_folder_path || "";

      try {
        let fileResponse;
        if (fileExtension.toLowerCase() === 'pdf') {
          // PDFファイルの場合
          fileResponse = await axios.get(
            `http://127.0.0.1:8000/api/files/download-file/${selectedProject.id}/${filename}`,
            {
              responseType: 'text',
              params: { source_type: 'box', folder_path: folderPath, file_type: 'pdf' }, // file_type パラメータを追加
            }
          );
        } else if (fileExtension.toLowerCase() === 'boxnote') {
          // BOXNOTEファイルの場合 (拡張子が boxnote であると仮定。JSONと明記するなら json に変更)
          fileResponse = await axios.get(
            `http://127.0.0.1:8000/api/files/download-file/${selectedProject.id}/${filename}`,
            {
              responseType: 'text',
              params: { source_type: 'box', folder_path: folderPath, file_type: 'boxnote' }, // file_type パラメータを追加
            }
          );
          const boxnoteJson = JSON.parse(fileResponse.data);
          const markdownContent = boxnoteJsonToMarkdown(boxnoteJson);
          setFileContent(markdownContent);
          return; // Important: Exit here to prevent setting raw JSON as fileContent later
        } else {
          // txtファイル、またはその他のテキストファイルとして扱う場合（デフォルト）
          fileResponse = await axios.get(
            `http://127.0.0.1:8000/api/files/download-file/${selectedProject.id}/${filename}`,
            {
              responseType: 'text',
              params: { source_type: 'box', folder_path: folderPath, file_type: 'txt' }, // file_type パラメータを追加
            }
          );
        }
        setFileContent(fileResponse.data); // ファイルの内容を保存
      } catch (error) {
        console.error('Error fetching file content:', error);
        alert('ファイルの内容を取得できませんでした。');
        setFileContent(`ファイルの内容を取得できませんでした。\n\n${error}`); // エラー内容も表示
      }
    }

    // スレッドが選択された場合、その内容を取得・表示
    if (selectedOption?.type === 'thread') {
      try {
        // Slack API を使ってスレッド内のメッセージを取得
        const response = await axios.get(`http://127.0.0.1:8000/api/slack/thread-messages`, {
          params: {
            channel_id: selectedProject?.slack_channel_id,
            thread_ts: selectedOption.value
          }
        });
        // 取得したスレッドの内容をMarkdownとして表示（または適切に処理）
        setFileContent(response.data);  // スレッド内容を表示用に保存
      } catch (error) {
        console.error('Error fetching thread content:', error);
        alert('スレッドの内容を取得できませんでした。');
        setFileContent(`スレッドの内容を取得できませんでした。\n\n${error}`); // エラー内容も表示
      }
    }
  };

  const handleDownloadFile = (filename: string) => {
    const folderPath = selectedProject.box_folder_id || selectedProject.box_folder_path || "";
    const link = document.createElement('a');
    link.href = `http://127.0.0.1:8000/api/files/download-file/${selectedProject.id}/${filename}?source_type=box&folder_path=${folderPath}`;
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
    <div className="h-full overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">ソース管理 Powered by Box & Slack</h2>

      {showTaskModal && (
        <TaskExtractionModal
          documentText={documentText}
          extractedTasks={extractedTasks}
          onCancel={handleModalCancel}
          onTaskLink={handleTaskLink}
        />
      )}

      {/* ソース選択ドロップダウン */}
      <div className="mb-4">
        <div className="flex items-center justify-end space-x-4 mb-4">
          <h3 className="mb-1 text-lg font-semibold">ファイルの内容確認:</h3>
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
          </button>
          <button
            onClick={handleTaskExtraction}
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
              'タスク抽出'
            )}
          </button>
        </div>
        <Select
          options={selectionOptions}
          onChange={handleSourceSelect}
          placeholder="ソースを選択してください（ファイルまたはSlackチャンネル）"
          isClearable
        />
      </div>

      {/* 選択されたソースの内容表示 */}
      {selectedSource && (selectedSource.type === 'file' || selectedSource.type === 'thread') && fileContent && (
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

      {/* タグごとのスレッド一覧表示セクション */}
      <div className="mt-6">
        {threadsByTag.map(({ tag, threads }) => (
          <div key={tag} className="mb-6">
            <h3 className="text-xl font-semibold mb-2">「{tag}」タグで検索されたスレッド一覧</h3>
            {threads.length > 0 ? (
              <ul className="space-y-2">
                {threads.map((thread) => (
                  <li key={thread.ts} className="p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                      onClick={() => { /* スレッド選択時の処理を追加可能 */ }}>
                    <strong>{thread.text.substring(0, 40)}</strong>
                    <p className="text-sm text-gray-600">作成者: {thread.user}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">該当するスレッドはありません。</p>
            )}
          </div>
        ))}
      </div>

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
                  className="text-[#173241] hover:text-[#0F2835]"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteFile(file.filename)}
                  className="text-[#BF4242] hover:text-[#A53939]"
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