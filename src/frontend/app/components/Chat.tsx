// src/frontend/app/components/Chat.tsx
'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import useChatStore from '../store/chatStore';
import useProjectStore from '../store/projectStore';
import axios from 'axios';
import ScrollableFeed from 'react-scrollable-feed';
import { FaRobot, FaUser } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { Send } from 'lucide-react';
import MaskingConfirmationModal from './MaskingConfirmationModal';

export default function Chat() {
  const { messages, addMessage, resetMessages } = useChatStore();
  const { selectedProject, slackChannels } = useProjectStore();
  const { selectedSource } = useProjectStore();
  const { maskingEnabled } = useProjectStore();
  const [inputMessage, setInputMessage] = useState<string>('');
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const { selectedSession, setSelectedSession } = useProjectStore();
  const [sessionTitleInput, setSessionTitleInput] = useState<string>(selectedSession || '');
  const [sending, setSending] = useState<boolean>(false);
  const [showMaskingModal, setShowMaskingModal] = useState(false);
  const [maskedText, setMaskedText] = useState<string>("");

  useEffect(() => {
    setSessionTitleInput(selectedSession || '');
  }, [selectedSession]);

  const LoadingIndicator = () => (
    <div className="flex items-center ml-2">
      <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      <span className="ml-1 text-sm text-gray-600">処理中...</span>
    </div>
  );

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setSending(true);

    let maskedText = "";
    // maskingEnabled が true の場合にのみマスキングを実行
    if (maskingEnabled) {
      try {
        const maskResponse = await axios.post<{ masked_text: string }>(
          'http://127.0.0.1:8000/api/mask/mask',
          { text: inputMessage }
        );
        const result = maskResponse.data.masked_text;
        setMaskedText(result);
        // マスキングされたテキストと元のテキストが異なる場合はモーダル表示
        if (result && result.trim() !== inputMessage) {
          setShowMaskingModal(true);
        } else {
          // 異常がない場合はそのまま送信処理へ
          await proceedWithSend(inputMessage);
        }
      } catch (error) {
        console.error('Error during masking:', error);
        await proceedWithSend(inputMessage);
      }
    } else {
      // マスキングが無効の場合、直接送信
      await proceedWithSend(inputMessage);
    }

    setSending(false);
  };

  // 実際にメッセージを送信する処理を関数化
  const proceedWithSend = async (messageToSend: string) => {
    // セッションタイトル設定などの既存の処理をここに移動
    if (!selectedSession && !sessionTitleInput) {
      setSessionTitleInput(messageToSend.trim().slice(0, 50));
      setSelectedSession(messageToSend.trim().slice(0, 50));
    }

    addMessage({ sender: 'user', message: messageToSend });
    const userMessage = messageToSend;
    setInputMessage('');
    setSending(true);

    try {
      let chatRequest: any = {
        message: userMessage,
        source_type: 'none',
        source_id: null,
      };

      // selectedSource が設定されている場合、その情報を使用
      const { selectedSource } = useProjectStore.getState();
      if (selectedSource) {
        chatRequest.source_type = selectedSource.type;
        chatRequest.source_id = selectedSource.value;
      }

      // チャットAPIへのリクエスト
      const response = await axios.post('http://127.0.0.1:8000/api/chat/chat', chatRequest);

      addMessage({ sender: 'ai', message: response.data.response });

      // セッションタイトルを決定
      const effectiveSessionTitle = selectedSession || sessionTitleInput || `Session_${selectedProject?.id}_${new Date().toISOString()}`;

      // チャット履歴を保存
      await saveChatHistory(effectiveSessionTitle);

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

    // 現在の全メッセージを取得
    const currentMessages = messages.map(msg => ({
      sender: msg.sender,
      message: msg.message,
      timestamp: new Date().toISOString()  // タイムスタンプを追加
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
    } catch (error) {
      console.error('Error saving chat history:', error);
      // 保存失敗時のエラーハンドリング（必要に応じて通知）
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4">生成AIチャット</h2>
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">セッション名</label>
        <input
          type="text"
          value={sessionTitleInput}
          onChange={(e) => {
            setSessionTitleInput(e.target.value);
            setSelectedSession(e.target.value);  // 入力と同時にストアに反映
          }}
          placeholder="セッション名を入力してください..."
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* チャットメッセージ表示 */}
      <div className="flex-1 bg-white p-4 rounded shadow" style={{overflowY: 'auto', height: 'calc(100% - 0.2rem)'}}>
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
          disabled={sending}  // 送信中は入力も無効化
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
  );
}
