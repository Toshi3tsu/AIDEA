// src/frontend/app/components/FileInput.tsx
'use client';

import React, { useState, useRef } from 'react';

interface FileInputProps {
  onFileChange: (file: File | null) => void;
}

const FileInput: React.FC<FileInputProps> = ({ onFileChange }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      setFileName(file.name);
    } else {
      setFileName(null);
    }
    onFileChange(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-4">
      <label htmlFor="fileInput" className="block text-gray-700 text-sm font-bold mb-2">
        ファイルを選択:
      </label>
      <div className="flex items-center">
        <button
          type="button"
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
          onClick={handleButtonClick}
        >
          ファイルを選択
        </button>
        <input
          type="file"
          id="fileInput"
          className="hidden"
          onChange={handleFileChange}
          ref={fileInputRef}
        />
        {fileName && <span className="text-gray-700">{fileName}</span>}
      </div>
    </div>
  );
};

export default FileInput;