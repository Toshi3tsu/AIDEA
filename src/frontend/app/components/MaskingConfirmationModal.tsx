// src/frontend/app/components/MaskingConfirmationModal.tsx
'use client';

import React, { useState } from 'react';

interface MaskingConfirmationModalProps {
  originalText: string;
  maskedText: string;
  onSendOriginal: (editedText: string) => void;
  onSendMasked: (editedText: string) => void;
  onCancel: () => void;
}

const MaskingConfirmationModal: React.FC<MaskingConfirmationModalProps> = ({
  originalText,
  maskedText,
  onSendOriginal,
  onSendMasked,
  onCancel,
}) => {
  const [editedOriginal, setEditedOriginal] = useState(originalText);
  const [editedMasked, setEditedMasked] = useState(maskedText);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full relative">
        {/* キャンセルボタン */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 px-2 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
        >
          キャンセル
        </button>

        {/* モーダルヘッダー */}
        <h2 className="text-xl font-bold mb-6 text-center">個人情報・機密情報の確認</h2>

        {/* テキストエリアとボタン */}
        <div className="flex space-x-4">
          {/* マスキング前のテキスト（編集可能） */}
          <div className="flex-1 flex flex-col">
            <h3 className="font-semibold mb-2">入力テキスト</h3>
            <textarea
              className="w-full h-60 p-2 border border-gray-300 rounded mb-2"
              value={editedOriginal}
              onChange={(e) => setEditedOriginal(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-[#BF4242] text-white rounded hover:bg-[#A53939]"
              onClick={() => onSendOriginal(editedOriginal)}
            >
              入力テキストを送信
            </button>
          </div>

          {/* マスキング後のテキスト */}
          <div className="flex-1 flex flex-col">
            <h3 className="font-semibold mb-2">マスキングされたテキスト</h3>
            <textarea
              className="w-full h-60 p-2 border border-gray-300 rounded mb-2"
              value={editedMasked}
              onChange={(e) => setEditedMasked(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-[#173241] text-white rounded hover:bg-[#0F2835]"
              onClick={() => onSendMasked(editedMasked)}
            >
              マスキングされたテキストを送信
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaskingConfirmationModal;
