// src/frontend/app/components/Chat.tsx
'use client';

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import axios from 'axios';
import ScrollableFeed from 'react-scrollable-feed';
import ReactMarkdown from 'react-markdown';
import { Send, BotMessageSquare, SquarePen } from 'lucide-react';
import { ChatResponse, MessageItem, ChatRequest } from '../../src/types/chat';
import useProjectStore, { SessionItem } from '../store/projectStore';
import { useModelStore } from '../store/modelStore';

export default function Chat() {
  // プロジェクト、モデル情報は store（または Context）から取得
  const {
    selectedProject,
    sessionTitles,
    setSessionTitles,
    selectedThreads,
    selectedUploadedFiles,
  } = useProjectStore();
  const { selectedModel } = useModelStore();

  // ローカル状態：現在のチャット履歴、セッションID／タイトル、入力メッセージ、通信中フラグなど
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [selectedSessionLocal, setSelectedSessionLocal] = useState<number | null>(null);
  const [openDropdownSession, setOpenDropdownSession] = useState<number | null>(null);

  // ページ初回表示時は「新規チャット」として状態を初期化
  useEffect(() => {
    startNewChat();
  }, []);

  // プロジェクトが変更された場合は、セッション一覧を再取得
  useEffect(() => {
    if (selectedProject) {
      fetchSessionTitles(selectedProject.id);
    }
  }, [selectedProject]);

  // セッション一覧を DB から取得
  const fetchSessionTitles = async (projectId: number) => {
    try {
      const response = await axios.get<SessionItem[]>(`http://127.0.0.1:8000/api/chat_history/sessions/${projectId}`);
      setSessionTitles(response.data);
    } catch (error) {
      console.error('セッション一覧の取得に失敗しました:', error);
    }
  };

  // 選択されたセッションのチャット履歴を取得
  const fetchChatHistory = async (projectId: number, sessionId: number) => {
    try {
      const response = await axios.get<MessageItem[]>(`http://127.0.0.1:8000/api/chat_history/history/${projectId}/${sessionId}`, {
        params: { model: selectedModel.value }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('チャット履歴の取得に失敗しました:', error);
    }
  };

  // ユーザーの発話を送信し、AI の返答を取得する
  const sendMessage = async (userMessage: string) => {
    if (!selectedProject || !selectedModel) return;
    setSending(true);

    // セッションIDが未設定なら、新規セッションとして作成（ここではタイムスタンプを ID として使用）
    const currentSessionId = sessionId || Date.now();
    if (!sessionId) {
      setSessionId(currentSessionId);
      // セッションタイトルが未設定なら、ユーザー発話の先頭部分をタイトルにする
      if (!sessionTitle) {
        setSessionTitle(userMessage.trim().slice(0, 50));
      }
    }

    // 作成するリクエストは、必要なファイル情報など「現在選択中」のもののみ
    const chatRequest: ChatRequest = {
      session_id: currentSessionId,
      project_id: selectedProject.id,
      message: userMessage,
      model: selectedModel.value,
      source_type: selectedUploadedFiles.length > 0 ? 'multiple' : 'none',
      source_id: null,
      source_content: null,
      source_name: selectedUploadedFiles.length > 0 ? selectedUploadedFiles : null,
      source_path: selectedUploadedFiles.length > 0 ? 'Uploaded Files' : null,
    };

    try {
      // ユーザー発話を一旦表示
      const userMsg: MessageItem = {
        sender: 'user',
        message: userMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputMessage('');

      // AI 応答の取得（バックエンド側でチャット履歴に含めた文脈情報を利用）
      const response = await axios.post<ChatResponse>('http://127.0.0.1:8000/api/chat/chat', chatRequest);
      const aiMsg: MessageItem = {
        sender: 'ai',
        message: response.data.response,
        timestamp: new Date().toISOString(),
        source_name: response.data.source_name || null,
        source_path: response.data.source_path || null,
        source_ids: response.data.source_ids || [],
      };
      setMessages((prev) => [...prev, aiMsg]);

      // チャット履歴保存APIを呼び出す
      const saveRequest = {
        session_id: currentSessionId,
        project_id: selectedProject.id,
        session_title: sessionTitle,
        messages: [userMsg, aiMsg] // 送信メッセージとAI応答のみを送信
      };
      await axios.post('http://127.0.0.1:8000/api/chat_history/save', saveRequest);

      // セッション一覧を更新 (新規セッションの場合など)
      if (selectedProject) {
        await fetchSessionTitles(selectedProject.id);
      }
    } catch (error) {
      console.error('メッセージ送信に失敗:', error);
      const errorMsg: MessageItem = {
        sender: 'ai',
        message: '申し訳ありません。エラーが発生しました。',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  // 新規チャットの開始：ローカル状態を初期化し、画面をクリア
  const startNewChat = () => {
    setSessionId(null);
    setSessionTitle('');
    setMessages([]);
  };

  // セッション選択時：DBから該当セッションのチャット履歴を取得
  const handleSessionSelect = async (session: SessionItem) => {
    if (!selectedProject) return;
    setSelectedSessionLocal(session.session_id);
    setSessionTitle(session.session_title);
    setSessionId(session.session_id);
    await fetchChatHistory(selectedProject.id, session.session_id);
  };

  // セッション操作用ドロップダウンの表示／非表示
  const toggleDropdown = (sid: number) => {
    setOpenDropdownSession((prev) => (prev === sid ? null : sid));
  };

  // セッション名の変更（DB更新後に一覧再取得）
  const handleRenameSession = async (session: SessionItem) => {
    const newTitle = prompt('新しいセッション名を入力してください:', session.session_title);
    if (!newTitle) return;
    try {
      await axios.put('http://127.0.0.1:8000/api/chat_history/rename', null, {
        params: {
          project_id: selectedProject?.id,
          session_id: session.session_id,
          new_title: newTitle,
        },
      });
      await fetchSessionTitles(selectedProject!.id);
    } catch (error) {
      console.error('セッション名変更に失敗:', error);
    }
  };

  // セッション削除後、一覧再取得して表示をクリア
  const handleDeleteSession = async (session: SessionItem) => {
    if (!confirm(`このセッション「${session.session_title}」を削除してもよろしいですか？`)) return;
    try {
      await axios.delete('http://127.0.0.1:8000/api/chat_history/delete', {
        params: {
          project_id: selectedProject?.id,
          session_id: session.session_id,
        },
      });
      await fetchSessionTitles(selectedProject!.id);
      startNewChat();
    } catch (error) {
      console.error('セッション削除に失敗:', error);
    }
  };

  // セッションのプロジェクト移動（更新後はセッション一覧再取得）
  const handleMoveProject = async (session: SessionItem) => {
    const newProjectIdStr = prompt('新しいプロジェクトIDを入力してください:');
    if (!newProjectIdStr) return;
    const newProjectId = parseInt(newProjectIdStr, 10);
    if (isNaN(newProjectId)) {
      alert('有効なプロジェクトIDを入力してください。');
      return;
    }
    try {
      await axios.put('http://127.0.0.1:8000/api/chat_history/move', null, {
        params: {
          old_project_id: selectedProject?.id,
          new_project_id: newProjectId,
          session_id: session.session_id,
        },
      });
      alert('セッションのプロジェクト移動が完了しました。');
      await fetchSessionTitles(selectedProject!.id);
    } catch (error) {
      console.error('セッション移動に失敗:', error);
    }
  };

  // 日付グループ分け用のヘルパー関数
  const getGroupName = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 1) return "今日";
    if (diffDays < 2) return "昨日";
    if (diffDays < 7) return "過去7日間";
    if (diffDays < 30) return "過去30日間";
    return date.getFullYear() + "年";
  };

  // セッション一覧のグループ分け
  const groupedSessions = sessionTitles.reduce((acc, session) => {
    const group = getGroupName(session.latest_timestamp);
    if (!acc[group]) acc[group] = [];
    acc[group].push(session);
    return acc;
  }, {} as Record<string, SessionItem[]>);

  const groupOrder = ["今日", "昨日", "過去7日間", "過去30日間"];
  const orderedGroupKeys = [
    ...groupOrder.filter((key) => key in groupedSessions),
    ...Object.keys(groupedSessions)
      .filter((key) => !groupOrder.includes(key))
      .sort((a, b) => Number(b.replace("年", "")) - Number(a.replace("年", "")))
  ];

  // シンプルなローディング表示用コンポーネント
  const LoadingIndicator = () => (
    <div className="flex items-center ml-2">
      <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      <span className="ml-1 text-sm text-gray-600">処理中...</span>
    </div>
  );

  const getSelectedSourcesLabel = () => {
    const selectedFileLabels = selectedUploadedFiles;
    const selectedThreadLabels = selectedThreads.map(threadId => {
      const thread = threadsByTag.flatMap(tbt => tbt.threads).find(thread => thread.ts === threadId);
      return thread ? `（スレッド）${thread.text.substring(0, 20)}...` : `（スレッド ID: ${threadId}）`; // スレッドが見つからない場合のfallback
    });

    const allSelectedLabels = [...selectedFileLabels, ...selectedThreadLabels];

    if (allSelectedLabels.length === 0) {
      return `選択ソース: なし`;
    } else if (allSelectedLabels.length === 1) {
      return `選択ソース: ${allSelectedLabels[0]}`;
    } else {
      return `選択ソース: ${allSelectedLabels[0]} 他${allSelectedLabels.length - 1}ソース`;
    }
  };

  const selectedSourcesLabel = getSelectedSourcesLabel();

  // textarea 要素への ref を作成
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // textarea の高さを調整する関数
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // 一旦 auto にしてscrollHeightをリセット
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`; // 最大高さを200pxに制限 (10行程度)
    }
  };

  // inputMessage が変更されたときに高さを調整
  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  return (
    <div className="flex h-full">
      {/* チャット領域 */}
      <div className="flex-1 flex flex-col px-4">
        {/* <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">セッション名</label>
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder="セッション名を入力してください..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div> */}

        {/* チャット履歴表示 */}
        <div className="flex-1 bg-white rounded shadow mb-2 py-2" style={{ overflowY: 'auto' }}>
          <ScrollableFeed>
            {messages
              .slice()
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
              .map((msg, index) => (
                <div
                  key={index}
                  className={`mb-2 mr-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div className={`inline-block max-w-[90%] rounded-lg px-4 py-2 ${msg.sender === 'user' ? 'bg-gray-100 text-gray-800 inline-block max-w-[70%]' : 'bg-white text-black'}`}>
                    {msg.sender === 'ai' ? (
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1 mr-2">
                          <BotMessageSquare className="text-[#CB6CE6]" size={24} />
                        </div>
                        <div>
                          <ReactMarkdown>{msg.message}</ReactMarkdown>
                          {msg.source_ids && msg.source_ids.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">参照: {msg.source_ids.join(', ')}</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        {msg.message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </ScrollableFeed>
        </div>

        {/* メッセージ入力フォーム */}
        <form onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (inputMessage.trim()) {
            sendMessage(inputMessage.trim());
          }
        }} className="flex items-center">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none resize-none overflow-y-hidden"
            disabled={sending}
            rows={1}
            style={{ maxHeight: '200px', overflowY: 'hidden' }}
            onInput={adjustTextareaHeight}
          />
          <button
            type="submit"
            className={`bg-[#CB6CE6] text-white px-4 py-2 rounded-r-lg flex items-center justify-center ${sending || !inputMessage.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#A94CCB]'}`}
            disabled={sending || !inputMessage.trim()}
          >
            {sending ? <LoadingIndicator /> : <Send className="h-5 w-5" />}
          </button>
        </form>

        {/* 選択されたソースの名称を表示 */}
        {Boolean(selectedSourcesLabel) && (
          <div className="mt-2 text-xs text-gray-600">
            {selectedSourcesLabel}
          </div>
        )}
      </div>

        {/* {showMaskingModal && (
          <MaskingConfirmationModal
            originalText={inputMessage}
            maskedText={maskedText}
            onSendOriginal={async (editedText) => {
              setShowMaskingModal(false);
              await proceedWithSend(editedText);
            }}
            onSendMasked={async () => {
              setShowMaskingModal(false);
              await proceedWithSend(maskedText);
            }}
            onCancel={() => {
              setShowMaskingModal(false);
              setSending(false);
            }}
          />
        )} */}

      {/* 右サイドバー：セッション一覧 */}
      <div className="w-64 bg-gray-50 shadow-lg flex flex-col p-4 overflow-y-auto">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-semibold">チャット履歴</h3>
            <button onClick={startNewChat} className="p-2 hover:bg-gray-200 rounded" title="新しいチャット">
              <SquarePen className="h-6 w-6 text-gray-600" />
            </button>
          </div>
          {selectedProject ? (
            <div className="max-h-180 overflow-y-auto"> {/* border border-gray-200 rounded p-1"> */}
              {orderedGroupKeys.length > 0 ? (
                orderedGroupKeys.map((groupKey) => (
                  <div key={groupKey}>
                    <div className="py-1 text-xs font-bold mt-4 mb-2">
                      {groupKey}
                    </div>
                    <ul>
                      {groupedSessions[groupKey].map((session) => (
                        <li
                          key={session.session_id}
                          className={`relative cursor-pointer p-1 hover:bg-gray-100 ${selectedSessionLocal === session.session_id ? 'bg-gray-200' : ''}`}
                          onClick={() => handleSessionSelect(session)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm truncate">{session.session_title}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDropdown(session.session_id);
                              }}
                              className="ml-2 text-gray-500 hover:text-gray-700 text-sm p-1"
                            >
                              ⋮
                            </button>
                          </div>
                          {openDropdownSession === session.session_id && (
                            <div className="fixed right-0 mt-1 w-36 bg-white border border-gray-200 rounded shadow-lg z-10">
                              <button
                                className="block w-full text-left text-sm px-2 py-1 hover:bg-gray-100"
                                onClick={() => { handleMoveProject(session); setOpenDropdownSession(null); }}
                              >
                                プロジェクトの移動
                              </button>
                              <button
                                className="block w-full text-left text-sm px-2 py-1 hover:bg-gray-100"
                                onClick={() => { handleRenameSession(session); setOpenDropdownSession(null); }}
                              >
                                セッション名称変更
                              </button>
                              <button
                                className="block w-full text-left text-sm px-2 py-1 hover:bg-gray-100"
                                onClick={() => { handleDeleteSession(session); setOpenDropdownSession(null); }}
                              >
                                セッション削除
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">履歴がありません</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">プロジェクトを選択してください</p>
          )}
        </div>
      </div>
    </div>
  );
}
