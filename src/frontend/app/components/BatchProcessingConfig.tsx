// src/frontend/app/components/BatchProcessingConfig.tsx
'use client';

import React from 'react';

interface LLMConfig {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  model: string;
  customPrompt?: string;
}

interface BatchProcessingConfigProps {
  onProcessBatch: (file: File, llmConfigs: LLMConfig[]) => Promise<void>;
  llmConfigs: LLMConfig[];
  onFileChange: (file: File | null) => void;
  selectedFile: File | null;
  selectedLLMs: string[]; // 追加
}

const BatchProcessingConfig: React.FC<BatchProcessingConfigProps> = ({
  onProcessBatch,
  llmConfigs,
  onFileChange,
  selectedFile,
  selectedLLMs, // 追加
}) => {

  const handleProcessBatch = async () => {
    if (!selectedFile) {
      alert('ファイルを選択してください。');
      return;
    }
    if (selectedLLMs.length !== 1) { // バッチ処理時は1つのみ選択
      alert('バッチ処理には1つのLLMを選択してください。');
      return;
    }

    const selectedLLMConfigs = llmConfigs.filter((config) =>
      selectedLLMs.includes(config.id)
    );

    await onProcessBatch(selectedFile, selectedLLMConfigs);
  };

  return (
    <div className="mb-4">
      <button
        className="bg-[#CB6CE6] hover:bg-[#A94CCB] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        type="button"
        onClick={handleProcessBatch}
        disabled={!selectedFile || selectedLLMs.length !== 1} // ボタンの有効/無効を条件付け
      >
        バッチ処理開始
      </button>
    </div>
  );
};

export default BatchProcessingConfig;
