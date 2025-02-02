// src/frontend/app/components/BatchProcessingLog.tsx
'use client';

import React from 'react';

interface LLMResponse {
  llmId: string;
  response: string;
}

interface BatchLog {
  id: string;
  timestamp: Date;
  file: string;
  prompts: {
    original: string;
    variations: string[];
    processed?: string; // 追加
  }[];
  responses: {
    [prompt: string]: {
      [llmId: string]: LLMResponse;
    };
  };
}

interface BatchProcessingLogProps {
  logs: BatchLog[];
}

const BatchProcessingLog: React.FC<BatchProcessingLogProps> = ({ logs }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">バッチ処理ログ</h2>
      {logs.length === 0 ? (
        <p>ログはありません。</p>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="border p-4 rounded shadow-md mb-4">
            <p>
              <strong>実行時間:</strong> {log.timestamp.toLocaleString()}
            </p>
            <p>
              <strong>ファイル:</strong> {log.file}
            </p>
            {log.prompts.map((promptData, index) => (
              <div key={index} className="mb-4">
                <p>
                  <strong>オリジナルプロンプト:</strong> {promptData.original}
                </p>
                {promptData.processed && (
                  <p>
                    <strong>処理後のプロンプト:</strong> {promptData.processed}
                  </p>
                )}
                <p>
                  <strong>言い換えパターン:</strong>
                  <ul>
                    {promptData.variations.map((variation, vIndex) => (
                      <li key={vIndex}>{variation}</li>
                    ))}
                  </ul>
                </p>
                {promptData.processed && Object.entries(log.responses[promptData.processed] || {}).map(
                  ([llmId, response]) => (
                    <div key={llmId} className="mt-2">
                      <p>
                        <strong>{llmId}の回答:</strong>
                      </p>
                      {response ? (
                        <ul className="ml-4">
                          <li>{response.response}</li>
                        </ul>
                      ) : (
                        <p className="ml-4">回答がありません</p>
                      )}
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default BatchProcessingLog;