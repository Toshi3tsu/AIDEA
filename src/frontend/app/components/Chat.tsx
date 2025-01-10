// src/frontend/app/components/Chat.tsx
'use client';

import React, { useState, FormEvent } from 'react';
import useChatStore from '../store/chatStore';
import useProjectStore from '../store/projectStore';
import axios from 'axios';
import ScrollableFeed from 'react-scrollable-feed';
import { FaRobot, FaUser } from 'react-icons/fa';
import { Send } from 'lucide-react';

export default function Chat() {
  const { messages, addMessage, resetMessages } = useChatStore();
  const { selectedProject, slackChannels } = useProjectStore();
  const [inputMessage, setInputMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // ユーザーのメッセージを追加
    addMessage({ sender: 'user', message: inputMessage });
    const userMessage = inputMessage;
    setInputMessage('');
    setSending(true);

    try {
      let chatRequest: any = {
        message: userMessage,
        source_type: 'none',
        source_id: null,
      };

      if (selectedProject) {
        // 連携されているSlackチャンネルがある場合
        const linkedSlack = slackChannels.find((channel) =>
          channel.id === selectedProject.id.toString()
        );
        if (linkedSlack) {
          chatRequest.source_type = 'slack';
          chatRequest.source_id = linkedSlack.id;
        }
      }

      // チャットAPIへのリクエスト
      const response = await axios.post('http://127.0.0.1:8000/api/chat/chat', chatRequest);

      // AIの応答を追加
      addMessage({ sender: 'ai', message: response.data.response });
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({ sender: 'ai', message: '申し訳ありません。エラーが発生しました。' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4">AIチャット</h2>

      {/* チャットメッセージ表示 */}
      <div className="flex-1 overflow-y-auto mb-4 bg-white p-4 rounded shadow">
        <ScrollableFeed>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex mb-2 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'ai' && (
                <div className="flex-shrink-0 mr-2">
                  <FaRobot className="text-[#CB6CE6]" size={24} />
                </div>
              )}
              <div
                className={`max-w-xs rounded-lg px-4 py-2 ${
                  msg.sender === 'user' ? 'bg-gray-100 text-gray-800' : 'bg-white-500 text-black'
                }`}
              >
                {msg.message}
              </div>
              {msg.sender === 'user' && (
                <div className="flex-shrink-0 ml-2">
                  <FaUser className="text-gray-500" size={24} />
                </div>
              )}
            </div>
          ))}
        </ScrollableFeed>
      </div>

      {/* メッセージ入力フィールド */}
      <form onSubmit={handleSendMessage} className="flex items-center">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none"
        />
        <button
          type="submit"
          className={`bg-[#CB6CE6] text-white px-4 py-2 rounded-r-lg hover:bg-[#D69292] flex items-center justify-center ${
            sending ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={sending}
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
