// src/frontend/app/components/Chat.tsx
'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import useChatStore from '../store/chatStore';
import useProjectStore, { SessionItem } from '../store/projectStore';
import { useModelStore } from '../store/modelStore';
import axios from 'axios';
import ScrollableFeed from 'react-scrollable-feed';
import { FaRobot } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { Send, Info } from 'lucide-react';
import MaskingConfirmationModal from './MaskingConfirmationModal';

interface ChatRecord {
  sender: string;
  message: string;
  timestamp: string;
}

export default function Chat() {
  // Chat Store
  const { messages, addMessage, resetMessages } = useChatStore();
  // Project Store
  const {
    selectedProject,
    slackChannels,
    selectedSource,
    maskingEnabled,
    projects,
    sessionTitles,
    setSessionTitles,
    setSelectedSession,
  } = useProjectStore();
  // Model Store
  const { selectedModel } = useModelStore();

  // Local States for Chat
  const [inputMessage, setInputMessage] = useState<string>('');
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const { selectedSession, setSelectedSession: setSelectedSessionStore } = useProjectStore();
  const [sessionTitleInput, setSessionTitleInput] = useState<string>(selectedSession || '');
  const [sending, setSending] = useState<boolean>(false);
  const [showMaskingModal, setShowMaskingModal] = useState(false);
  const [maskedText, setMaskedText] = useState<string>("");
  const [sourceContent, setSourceContent] = useState<string | null>(null);

  // Local States for Right Sidebar
  const [selectedSessionLocal, setSelectedSessionLocal] = useState<string | null>(null);
  const [openDropdownSession, setOpenDropdownSession] = useState<string | null>(null);

  // Update sessionTitleInput when selectedSession changes
  useEffect(() => {
    setSessionTitleInput(selectedSession || '');
  }, [selectedSession]);

  // Fetch session titles when selectedProject changes
  useEffect(() => {
    if (selectedProject) {
      fetchSessionTitles(selectedProject.id);
    }
  }, [selectedProject]);

  // selectedSource が変更されたらソース内容を取得
  useEffect(() => {
    const fetchSourceContent = async () => {
      if (selectedSource) {
        try {
          const folderPath = selectedProject?.box_folder_id || selectedProject?.box_folder_path || "";
          let fileType = 'txt'; // デフォルトは txt
          if (selectedSource.type === 'file') {
            const fileExtension = selectedSource.value.split('.').pop()?.toLowerCase() || '';
            if (fileExtension === 'pdf') {
              fileType = 'pdf';
            } else if (fileExtension === 'boxnote') {
              fileType = 'boxnote';
            }
          } else if (selectedSource.type === 'thread') {
            fileType = 'thread';
          }

          const response = await axios.get(
            `http://127.0.0.1:8000/api/files/download-file/${selectedProject?.id}/${selectedSource.value}`,
            {
              responseType: 'text',
              params: { source_type: 'box', folder_path: folderPath, file_type: fileType },
            }
          );
          setSourceContent(response.data);
        } catch (error) {
          console.error('Error fetching file content:', error);
          setSourceContent(`ファイルの内容を取得できませんでした。\n\n${error}`);
        }
      } else {
        setSourceContent(null);
      }
    };

    fetchSourceContent();
  }, [selectedSource, selectedProject]);

  const fetchSessionTitles = async (projectId: number) => {
    try {
      const response = await axios.get<SessionItem[]>(`http://127.0.0.1:8000/api/chat_history/sessions/${projectId}`);
      setSessionTitles(response.data);
    } catch (error) {
      console.error('Error fetching session titles:', error);
    }
  };

  const LoadingIndicator = () => (
    <div className="flex items-center ml-2">
      <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      <span className="ml-1 text-sm text-gray-600">処理中...</span>
    </div>
  );

  const handleNewChat = () => {
    resetMessages();
    setSessionTitleInput('');
    setSelectedSessionStore('');
    setInputMessage('');
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setSending(true);

    let maskedText = "";
    if (maskingEnabled) {
      try {
        const maskResponse = await axios.post<{ masked_text: string }>('http://127.0.0.1:8000/api/mask/mask',{
          text: inputMessage,
        });
        const result = maskResponse.data.masked_text;
        setMaskedText(result);
        if (result && result.trim() !== inputMessage) {
          setShowMaskingModal(true);
        } else {
          await proceedWithSend(inputMessage);
        }
      } catch (error) {
        console.error('Error during masking:', error);
        await proceedWithSend(inputMessage);
      }
    } else {
      await proceedWithSend(inputMessage);
    }

    setSending(false);
  };

  const proceedWithSend = async (messageToSend: string) => {
    const proposedSessionTitle = messageToSend.trim().slice(0, 50);

    if (!selectedSession && !sessionTitleInput) {
      setSessionTitleInput(proposedSessionTitle);
      setSelectedSessionStore(proposedSessionTitle);
    }

    addMessage({ sender: 'user', message: messageToSend });
    const userMessage = messageToSend;
    setInputMessage('');
    setSending(true);

    try {
      let chatRequest: any = {
        message: userMessage,
        model: selectedModel.value,
        source_type: 'none',
        source_id: null,
        source_content: null,
      };

      if (selectedSource && sourceContent) {
        chatRequest.source_type = selectedSource.type;
        chatRequest.source_id = selectedSource.value;
        chatRequest.source_content = sourceContent;
      }

      const response = await axios.post('http://127.0.0.1:8000/api/chat/chat', chatRequest);

      addMessage({ sender: 'ai', message: response.data.response });

      const effectiveSessionTitle =
        selectedSession || sessionTitleInput || proposedSessionTitle || `Session_${selectedProject?.id}_${new Date().toISOString()}`;

      setTimeout(() => {
        saveChatHistory(effectiveSessionTitle);
      }, 0);

    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({ sender: 'ai', message: '申し訳ありません。エラーが発生しました。' });
    } finally {
      setSending(false);
    }
  };

  const saveChatHistory = async (sessionTitle: string) => {
    if (!selectedProject) {
      console.warn('選択されたプロジェクトがありません。');
      return;
    }

    const currentMessages = useChatStore.getState().messages.map(msg => ({
      sender: msg.sender,
      message: msg.message,
      timestamp: new Date().toISOString()
    }));

    console.log("Request to save chat history:", {
      project_id: selectedProject?.id,
      session_title: sessionTitle,
      messages: currentMessages,
    });

    try {
      await axios.post('http://127.0.0.1:8000/api/chat_history/save', {
        project_id: selectedProject?.id,
        session_title: sessionTitle,
        messages: currentMessages
      });
      console.log('チャット履歴が保存されました。');

      await fetchSessionTitles(selectedProject.id);
      setSelectedSessionStore(sessionTitle);
      setSelectedSessionLocal(sessionTitle);
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  // Right Sidebar Handlers
  const toggleDropdown = (title: string) => {
    setOpenDropdownSession(prev => (prev === title ? null : title));
  };

  const handleSessionSelect = async (sessionTitle: string) => {
    setSelectedSessionLocal(sessionTitle);
    setSelectedSessionStore(sessionTitle);
    resetMessages();
    try {
      const response = await axios.get<ChatRecord[]>(`http://127.0.0.1:8000/api/chat_history/history/${selectedProject?.id}/${sessionTitle}`, {
        params: { model: selectedModel.value }
      });
      response.data.forEach(record => {
        addMessage({ sender: record.sender as 'user' | 'ai', message: record.message });
      });
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleRenameSession = async (sessionTitle: string) => {
    const newTitle = prompt('新しいセッション名を入力してください:', sessionTitle);
    if (!newTitle) return;
    try {
      await axios.put('http://127.0.0.1:8000/api/chat_history/rename', null, {
        params: {
          project_id: selectedProject?.id,
          old_title: sessionTitle,
          new_title: newTitle,
        },
      });
      fetchSessionTitles(selectedProject!.id);
    } catch (error) {
      console.error('Error renaming session:', error);
    }
  };

  const handleDeleteSession = async (sessionTitle: string) => {
    if (!confirm('このセッションを削除してもよろしいですか？')) return;
    try {
      await axios.delete('http://127.0.0.1:8000/api/chat_history/delete', {
        params: {
          project_id: selectedProject?.id,
          session_title: sessionTitle,
        },
      });
      fetchSessionTitles(selectedProject!.id);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleMoveProject = async (sessionTitle: string) => {
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
          session_title: sessionTitle,
        },
      });
      alert('セッションのプロジェクト移動が完了しました。');
    } catch (error) {
      console.error('Error moving session:', error);
    }
  };

  // 日時グループの名称を決定するヘルパー関数
  const getGroupName = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays < 1) return "今日";
    if (diffDays < 2) return "昨日";
    if (diffDays < 7) return "過去7日間";
    if (diffDays < 30) return "過去30日間";
    return date.getFullYear() + "年";
  };

  // セッション一覧をグループ分けする
  const groupedSessions = sessionTitles.reduce((acc, session) => {
    const group = getGroupName(session.latest_timestamp);
    if (!acc[group]) acc[group] = [];
    acc[group].push(session);
    return acc;
  }, {} as Record<string, SessionItem[]>);

  // 表示順を決める（先頭は「今日」「昨日」「過去7日間」「過去30日間」、以降は年（降順））
  const groupOrder = ["今日", "昨日", "過去7日間", "過去30日間"];
  const orderedGroupKeys = [
    ...groupOrder.filter(key => key in groupedSessions),
    ...Object.keys(groupedSessions)
      .filter(key => !groupOrder.includes(key))
      .sort((a, b) => Number(b.replace("年", "")) - Number(a.replace("年", "")))
  ];

  return (
    <div className="flex h-full">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">生成AIチャット</h2>
          <button
            onClick={handleNewChat}
            className="font-bold bg-[#173241] text-white px-4 py-2 rounded hover:bg-[#0F2835]"
          >
            新規チャット
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">セッション名</label>
          <input
            type="text"
            value={sessionTitleInput}
            onChange={(e) => {
              setSessionTitleInput(e.target.value);
              setSelectedSessionStore(e.target.value);
            }}
            placeholder="セッション名を入力してください..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* チャットメッセージ表示 */}
        <div className="flex-1 bg-white p-4 rounded shadow mb-4" style={{overflowY: 'auto', height: 'calc(100% - 0.2rem)'}}>
          <ScrollableFeed>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex mb-2 mr-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="flex-shrink-0">
                    <FaRobot className="text-[#CB6CE6]" size={24} />
                  </div>
                )}
                <div
                  className={`w-[70%] max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.sender === 'user' ? 'bg-gray-100 text-gray-800' : 'bg-white text-black'
                  }`}
                >
                  {msg.sender === 'ai' ? (
                    <ReactMarkdown>{msg.message}</ReactMarkdown>
                  ) : (
                    msg.message
                  )}
                </div>
              </div>
            ))}
          </ScrollableFeed>
        </div>

        {showMaskingModal && (
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
        )}

        {/* メッセージ入力フィールド */}
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            className={`bg-[#CB6CE6] text-white px-4 py-2 rounded-r-lg flex items-center justify-center ${
              sending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#A94CCB]'
            }`}
            disabled={sending}
          >
            {sending ? <LoadingIndicator /> : <Send className="h-5 w-5" />}
          </button>
        </form>
      </div>

      {/* Right Sidebar */}
      <div className="w-64 bg-gray-50 shadow-lg flex flex-col p-4 overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-md font-semibold mb-2">チャット履歴</h3>
          {selectedProject ? (
            <div className="max-h-180 overflow-y-auto border border-gray-200 rounded p-1">
              {orderedGroupKeys.length > 0 ? (
                orderedGroupKeys.map(groupKey => (
                  <div key={groupKey}>
                    {/* グループ見出し */}
                    <div className="px-2 py-1 bg-gray-200 text-xs font-bold text-gray-700">
                      {groupKey}
                    </div>
                    <ul>
                      {groupedSessions[groupKey].map((session) => (
                        <li
                          key={session.session_title}
                          className={`relative cursor-pointer p-1 hover:bg-gray-100 ${selectedSessionLocal === session.session_title ? 'bg-gray-200' : ''}`}
                          onClick={() => handleSessionSelect(session.session_title)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm truncate">{session.session_title}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDropdown(session.session_title);
                              }}
                              className="ml-2 text-gray-500 hover:text-gray-700 text-sm p-1"
                            >
                              ⋮
                            </button>
                          </div>
                          {openDropdownSession === session.session_title && (
                            <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded shadow-lg z-10">
                              <button
                                className="block w-full text-left text-sm px-2 py-1 hover:bg-gray-100"
                                onClick={() => handleMoveProject(session.session_title)}
                              >
                                プロジェクトの移動
                              </button>
                              <button
                                className="block w-full text-left text-sm px-2 py-1 hover:bg-gray-100"
                                onClick={() => handleRenameSession(session.session_title)}
                              >
                                セッション名称変更
                              </button>
                              <button
                                className="block w-full text-left text-sm px-2 py-1 hover:bg-gray-100"
                                onClick={() => handleDeleteSession(session.session_title)}
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
