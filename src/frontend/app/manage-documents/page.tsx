// src/frontend/app/manage-documents/page.tsx
'use client';

import React from 'react';
import ManageDocuments from '../components/ManageDocuments';
import Chat from '../components/Chat';

export default function ManageDocumentsPage() {
  return (
    <div className="flex h-full">
      {/* 左側: ドキュメント管理 */}
      <div className="w-1/2 p-4 border-r">
        <ManageDocuments />
      </div>

      {/* 右側: チャット */}
      <div className="w-1/2 p-4">
        <Chat />
      </div>
    </div>
  );
}
