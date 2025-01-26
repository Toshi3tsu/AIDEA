// src/frontend/app/research-ai/page.tsx
'use client'

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const ResearchAIPage = () => {
  const [request, setRequest] = useState('');
  const [llm1Response, setLlm1Response] = useState('');
  const [llm2Response, setLlm2Response] = useState('');
  const [llm3Response, setLlm3Response] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [llm1Enabled, setLlm1Enabled] = useState(true);
  const [llm2Enabled, setLlm2Enabled] = useState(true);
  const [llm3Enabled, setLlm3Enabled] = useState(true);

  const handleResearch = async () => {
    setIsLoading(true);
    setError('');
    setLlm1Response('');
    setLlm2Response('');
    setLlm3Response('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/ai/research-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ // チェックボックスの状態を送信
          request,
          llm1Enabled,
          llm2Enabled,
          llm3Enabled,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData?.detail || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      setLlm1Response(data.llm1Response || 'LLM1からの回答がありません');
      setLlm2Response(data.llm2Response || 'LLM2からの回答がありません');
      setLlm3Response(data.llm3Response || 'LLM3からの回答がありません');

    } catch (error: any) {
      console.error('リサーチAIの実行中にエラーが発生しました:', error);
      setError(`リサーチAIの実行中にエラーが発生しました: ${error.message}`);
      setLlm1Response('エラーが発生しました。');
      setLlm2Response('エラーが発生しました。');
      setLlm3Response('エラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">リサーチAI</h1>
      <div className="mb-4">
        <label htmlFor="researchRequest" className="block text-gray-700 text-sm font-bold mb-2">
          リクエスト内容:
        </label>
        <textarea
          id="researchRequest"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          rows={4}
          placeholder="リサーチしたい内容を入力してください"
          value={request}
          onChange={(e) => setRequest(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <button
          className="bg-[#CB6CE6] hover:bg-[#A94CCB] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="button"
          onClick={handleResearch}
          disabled={isLoading}
        >
          {isLoading ? '調査中...' : '調査開始'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">エラー!</strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* LLM 1 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">GPT-4o</h2> {/* モデル名タイトル */}
            <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 accent-[#173241] rounded border-gray-300 focus:ring-[#0F2835]"
                checked={llm1Enabled}
                onChange={(e) => setLlm1Enabled(e.target.checked)}
              />
              <span className="text-gray-700 text-sm">表示</span>
            </label>
          </div>
          {llm1Enabled && ( // 表示/非表示の切り替え
            <div className="border p-4 rounded shadow-md">
              <ReactMarkdown className="prose max-w-full">
                {llm1Response}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* LLM 2 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">DeepSeek V3</h2> {/* モデル名タイトル */}
            <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 accent-[#173241] rounded border-gray-300 focus:ring-[#0F2835]"
                checked={llm2Enabled}
                onChange={(e) => setLlm2Enabled(e.target.checked)}
              />
              <span className="text-gray-700 text-sm">表示</span>
            </label>
          </div>
          {llm2Enabled && ( // 表示/非表示の切り替え
            <div className="border p-4 rounded shadow-md">
              <ReactMarkdown className="prose max-w-full">
                {llm2Response}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* LLM 3 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Perplexity</h2> {/* モデル名タイトル */}
            <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 accent-[#173241] rounded border-gray-300 focus:ring-[#0F2835]"
                checked={llm3Enabled}
                onChange={(e) => setLlm3Enabled(e.target.checked)}
              />
              <span className="text-gray-700 text-sm">表示</span>
            </label>
          </div>
          {llm3Enabled && ( // 表示/非表示の切り替え
            <div className="border p-4 rounded shadow-md">
              <ReactMarkdown className="prose max-w-full">
                {llm3Response}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearchAIPage;