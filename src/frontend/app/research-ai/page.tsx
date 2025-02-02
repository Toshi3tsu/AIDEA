// src/frontend/app/research-ai/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText } from 'lucide-react';
import ReactDOM from 'react-dom/client';
import BatchProcessingConfig from '../components/BatchProcessingConfig';
import BatchProcessingLog from '../components/BatchProcessingLog';
import { utils, writeFile, read } from 'xlsx';

interface LLMConfig {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  model: string;
  customPrompt?: string;
}

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
    processed?: string;
  }[];
  responses: {
    [prompt: string]: {
      [llmId: string]: LLMResponse;
    };
  };
}

const ResearchAIPage = () => {
  useEffect(() => {
    document.querySelector('.page-title')!.textContent = 'ドキュメント作成AI';
    const iconContainer = document.querySelector('.page-icon')!;
    iconContainer.innerHTML = '';
    const icon = document.createElement('div');
    const root = ReactDOM.createRoot(icon);
    root.render(<FileText className="h-5 w-5" />);
    iconContainer.appendChild(icon);
  }, []);

  const [request, setRequest] = useState('');
  const [llmResponses, setLlmResponses] = useState<{ [llmId: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLLMs, setSelectedLLMs] = useState<string[]>([]); // 共通のLLM選択ステート
  const [batchLogs, setBatchLogs] = useState<BatchLog[]>([]);
  const [llmConfigs, setLlmConfigs] = useState<LLMConfig[]>([
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o-mini',
      endpoint: 'https://api.openai.com/v1',
      apiKey: 'YOUR_OPENAI_API_KEY',
      model: 'gpt-4o-mini',
    },
    {
      id: 'deepseek-chat-v3',
      name: 'DeepSeek V3',
      endpoint: 'https://api.deepseek.com/v1',
      apiKey: 'YOUR_DEEPSEEK_API_KEY',
      model: 'deepseek-chat',
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      endpoint: 'https://api.perplexity.ai',
      apiKey: 'YOUR_PERPLEXITY_API_KEY',
      model: 'sonar',
    },
  ]);
  const [queryVariations, setQueryVariations] = useState<string[]>([]);
  const [selectedQueries, setSelectedQueries] = useState<string[]>([]);

  // 追加：Excelファイルプレビュー関連のステート
  const [excelData, setExcelData] = useState<any[][]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState<string | null>(null);
  const [selectedHeader, setSelectedHeader] = useState<string | null>(null);
  const [headerType, setHeaderType] = useState<"row" | "col" | null>(null);
  const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
  const [rowHeaders, setRowHeaders] = useState<string[]>([]);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleResearch = async () => {
    setIsLoading(true);
    setError('');
    setLlmResponses({});
  
    try {
      if (selectedLLMs.length === 0) {
        throw new Error('少なくとも1つのLLMを選択してください。');
      }
  
      const response = await fetch('http://127.0.0.1:8000/api/ai/research-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request,
          selectedLLMs, // 修正: 選択されたLLMを送信
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData?.detail || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
  
      const data = await response.json();
  
      // 各LLMのレスポンスを設定
      const responses: { [llmId: string]: string } = {};
      selectedLLMs.forEach((llmId: string) => {
        responses[llmId] = data.llmResponses[llmId] || `${llmId}からの回答がありません`;
      });
      setLlmResponses(responses);
    } catch (error: any) {
      console.error('リサーチAIの実行中にエラーが発生しました:', error);
      // error.message を使用してエラーメッセージを設定
      setError(`リサーチAIの実行中にエラーが発生しました: ${error.message}`);
      // 全LLMのレスポンスにエラーメッセージを設定
      const errorResponses: { [llmId: string]: string } = {};
      selectedLLMs.forEach((llmId: string) => {
        errorResponses[llmId] = 'エラーが発生しました。';
      });
      setLlmResponses(errorResponses);
    } finally {
      setIsLoading(false);
    }
  };

  // ファイル選択時の処理を更新
  const handleFileChange = async (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      setFileName(file.name);
      try {
        const fileType = file.name.split('.').pop()?.toLowerCase();
        if (fileType === 'xlsx' || fileType === 'xls') {
          // Excelファイルの場合はプレビューを表示
          // シート名一覧と最初のシートのデータを取得
          const data = await extractExcelData(file);
          const colHeaders = generateColumnHeaders(data[0]?.length || 0);
          const rowHeaders = data.map((_, index) => (index + 1).toString());

          setColumnHeaders(colHeaders);
          setRowHeaders(rowHeaders);
          setExcelData(data);
          setSelectedHeader(null);
          setHeaderType(null);
          setSelectedColumnIndex(null);
        } else {
          setExcelData([]);
          setSelectedHeader(null);
          setHeaderType(null);
          setColumnHeaders([]);
          setRowHeaders([]);
          setSelectedColumnIndex(null);
          setSheetNames([]); // Excel 以外の場合はシート名をクリア
          setSelectedSheetName(null);
        }
      } catch (error: any) {
        console.error('ファイル処理中にエラーが発生しました:', error);
        setError(`ファイル処理中にエラーが発生しました: ${error}`);
        setExcelData([]);
        setSelectedHeader(null);
        setHeaderType(null);
        setColumnHeaders([]);
        setRowHeaders([]);
        setSelectedColumnIndex(null);
        setSheetNames([]); // エラー発生時もシート名をクリア
        setSelectedSheetName(null);
      }
    } else {
      setExcelData([]);
      setSelectedHeader(null);
      setHeaderType(null);
      setColumnHeaders([]);
      setRowHeaders([]);
      setSelectedColumnIndex(null);
      setFileName(null);
      setSheetNames([]); // ファイルが選択解除されたらシート名をクリア
      setSelectedSheetName(null);
    }
  };

  const handleSheetSelect = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSheet = event.target.value;
    setSelectedSheetName(selectedSheet);
    if (selectedFile) {
      try {
        const data = await extractExcelData(selectedFile, selectedSheet);
        const colHeaders = generateColumnHeaders(data[0]?.length || 0);
        const rowHeaders = data.map((_, index) => (index + 1).toString());

        setColumnHeaders(colHeaders);
        setRowHeaders(rowHeaders);
        setExcelData(data);
        setSelectedHeader(null);
        setHeaderType(null);
        setSelectedColumnIndex(null);
      } catch (error) {
        console.error('シート切り替え中にエラーが発生しました:', error);
        setError(`シート切り替え中にエラーが発生しました: ${error}`);
        setExcelData([]);
        setSelectedHeader(null);
        setHeaderType(null);
        setColumnHeaders([]);
        setRowHeaders([]);
        setSelectedColumnIndex(null);
      }
    }
  };

  const generateColumnHeaders = (length: number): string[] => {
    const headers: string[] = [];
    for (let i = 0; i < length; i++) {
      headers.push(String.fromCharCode(65 + i)); // A, B, C...
    }
    return headers;
  };

  // Excelファイル解析関数
  const extractExcelData = async (file: File, sheetName?: string): Promise<any[][]> => {
    return new Promise(async (resolve, reject) => {
      try {
        const { read, utils } = await import('xlsx');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = read(arrayBuffer, { type: 'buffer' });
        // シート名を取得
        const sheetNamesList = workbook.SheetNames;
        setSheetNames(sheetNamesList);

        // シート名が指定されていない場合は最初のシートを選択
        const targetSheetName = sheetName || sheetNamesList[0];
        setSelectedSheetName(targetSheetName); // デフォルトで最初のシートを選択

        if (!targetSheetName) {
          reject("シートが見つかりません");
          return;
        }
        const worksheet = workbook.Sheets[targetSheetName];
        const data = utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
        resolve(data);
      } catch (error: any) {
        reject(`ファイルの読み込み中にエラーが発生しました: ${error}`);
      }
    });
  };

  const extractTextFromData = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const fileType = file.name.split('.').pop()?.toLowerCase();
          let textData: string[] = [];

          if (fileType === 'csv') {
            const csvText = event.target?.result as string;
            const { parse } = await import('papaparse');
            const result = parse(csvText, { header: false });
            textData = result.data
              .filter(row => Array.isArray(row) && row.length > 0)
              .map(row => row.join(' '));
          } else if (fileType === 'xlsx' || fileType === 'xls') {
            if (selectedHeader && headerType) {
              let data;
              if (headerType === "col") {
                const columnIndex = columnHeaders.findIndex((header) => header === selectedHeader);
                data = excelData.map(row => row[columnIndex]).filter(Boolean);
              } else {
                const rowIndex = rowHeaders.findIndex((header) => header === selectedHeader);
                console.log(`選択された行ヘッダー: ${selectedHeader}, インデックス: ${rowIndex}`);
                if (rowIndex >= 0) {
                  data = excelData[rowIndex].filter(Boolean);
                  console.log(`処理対象の行: ${rowIndex + 1}`);
                  data = excelData[rowIndex].filter(Boolean);
                } else {
                  reject("選択された行は存在しません");
                  return;
                }
              }
              textData = data.map(String);
            } else {
              reject("列または行を選択してください");
              return;
            }
          } else {
            reject('サポートされていないファイル形式です。');
            return;
          }
          resolve(textData);
        } catch (error: any) {
          reject(`ファイルの読み込み中にエラーが発生しました: ${error}`);
        }
      };
      reader.onerror = () => {
        reject('ファイルの読み込みに失敗しました。');
      };
      if (file) {
        const fileType = file.name.split('.').pop()?.toLowerCase();
        if (fileType === 'csv' || fileType === 'txt') {
          reader.readAsText(file);
        } else {
          reader.readAsArrayBuffer(file);
        }
      }
    });
  };

  // ヘッダー選択時の処理
  const handleHeaderClick = (header: string, type: "row" | "col") => {
    setSelectedHeader(header);
    setHeaderType(type);
    if (type === "col") {
      const columnIndex = columnHeaders.findIndex((col) => col === header);
      setSelectedColumnIndex(columnIndex);
    } else {
      setSelectedColumnIndex(null);
    }
  };

  const generateQueryVariations = async (text: string): Promise<string[]> => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/ai/generate-variations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData?.detail || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      const data = await response.json();
      return [text, ...data.variations]; // 元のクエリを先頭に追加
    } catch (error: any) {
      console.error('言い換えパターンの生成中にエラーが発生しました:', error);
      throw new Error(`言い換えパターンの生成中にエラーが発生しました: ${error.message}`);
    }
  };

  const submitPromptToLLM = async (
    prompt: string,
    llmConfig: LLMConfig
  ): Promise<LLMResponse> => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/ai/submit-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, llmConfig }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData?.detail || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      const data = await response.json();
      console.log('submitPromptToLLM response:', data); // レスポンスをログに出力
      if (!data.response) {
        console.error('LLMからのレスポンスがありません');
        throw new Error('LLMからのレスポンスがありません');
      }
      return { llmId: llmConfig.id, response: data.response };
    } catch (error: any) {
      console.error(`LLM '${llmConfig.name}' への送信中にエラーが発生しました:`, error);
      throw new Error(
        `LLM '${llmConfig.name}' への送信中にエラーが発生しました: ${error.message}`
      );
    }
  };

  const handleGenerateVariations = async () => {
    try {
      const variations = await generateQueryVariations(request);
      setQueryVariations(variations);
    } catch (error) {
      console.error('クエリの言い換え生成に失敗しました:', error);
      setQueryVariations([request]);
    }
  };

  const handleQuerySelection = (query: string) => {
    setSelectedQueries((prev) => {
      if (prev.includes(query)) {
        return prev.filter((q) => q !== query);
      } else {
        return [...prev, query];
      }
    });
  };

  const processBatch = async (file: File, llmConfigs: LLMConfig[]) => {
    setIsLoading(true);
    setError('');
    try {
      const textData = await extractTextFromData(file);
      console.log("Text data:", textData);
      const newBatchLog: BatchLog = {
        id: String(Date.now()),
        timestamp: new Date(),
        file: file.name,
        prompts: [],
        responses: {},
      };
  
      if (selectedQueries.length === 0) {
        setError('クエリを選択してください。');
        return;
      }
  
      const outputData: any[][] = [];
  
      for (let i = 0; i < textData.length; i++) {
        const text = textData[i];
        const rowData: any[] = [];
        for (let j = 0; j < selectedQueries.length; j++) {
          const query = selectedQueries[j];
          const processedPrompt = query.replace('{{input}}', text);
          console.log('Processed prompt:', processedPrompt);
          newBatchLog.prompts.push({ original: query, variations: [], processed: processedPrompt });
          newBatchLog.responses[processedPrompt] = {};
  
          const llmResponses = await Promise.all(
            llmConfigs.map(async (llmConfig) => {
              try {
                const response = await submitPromptToLLM(processedPrompt, llmConfig);
                return response;
              } catch (error) {
                console.error(`LLM '${llmConfig.name}' でエラーが発生しました:`, error);
                return { llmId: llmConfig.id, response: `エラーが発生しました: ${error}` };
              }
            })
          );
          llmResponses.forEach(response => {
            if (newBatchLog.responses[processedPrompt]) {
              newBatchLog.responses[processedPrompt][response.llmId] = response;
            }
          });
          rowData.push(...llmResponses.map(res => res.response));
        }
        outputData.push(rowData);
      }
  
      const wb = utils.book_new();
      const ws = utils.aoa_to_sheet(outputData);
      utils.book_append_sheet(wb, ws, "Batch Results");
  
      const fileNameParts = file.name.split('.');
      const newFileName = `${fileNameParts.slice(0, -1).join('.')}_processed.${fileNameParts.slice(-1)[0]}`;
      writeFile(wb, newFileName);
      setBatchLogs((prevLogs) => [newBatchLog, ...prevLogs]);
    } catch (error: any) {
      console.error('バッチ処理中にエラーが発生しました:', error);
      setError(`バッチ処理中にエラーが発生しました: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 共通のLLM選択ハンドラー
  const handleLLMSelectionChange = (llmId: string, checked: boolean) => {
    setSelectedLLMs(prev => {
      if (checked) {
        return [...prev, llmId];
      } else {
        return prev.filter(id => id !== llmId);
      }
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        {/* 共通のLLM選択セクション */}
        <h2 className="text-lg font-semibold mb-2">使用するLLMを選択:</h2>
        <div className="flex flex-wrap gap-4 mb-4">
          {llmConfigs.map((llm) => (
            <label key={llm.id} className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-600"
                checked={selectedLLMs.includes(llm.id)}
                onChange={(e) => handleLLMSelectionChange(llm.id, e.target.checked)}
              />
              <span className="ml-2 text-gray-700">{llm.name}</span>
            </label>
          ))}
        </div>

        {/* Excelプレビュー表示 */}
        {selectedFile && excelData.length > 0 && (
          <div className="mb-4 overflow-x-auto">
            <h2 className="text-lg font-semibold mb-2">Excelプレビュー</h2>

            {/* **シート選択ドロップダウンリスト** */}
            {sheetNames.length > 1 && (
              <div className="mb-2">
                <label htmlFor="sheetSelect" className="block text-gray-700 text-sm font-bold mb-1">
                  シート選択:
                </label>
                <select
                  id="sheetSelect"
                  className="shadow appearance-none border rounded w-auto py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={selectedSheetName || ''}
                  onChange={handleSheetSelect}
                >
                  {sheetNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* **修正: table を div で囲み、overflow: auto を適用** */}
            <div className="overflow-auto max-h-[500px] max-w-full border border-gray-300">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 px-4 py-2"></th>
                    {columnHeaders.map((header, index) => (
                      <th
                        key={index}
                        className={`border border-gray-300 px-4 py-2 cursor-pointer ${selectedHeader === header && headerType === "col" ? 'bg-blue-200' : ''}`}
                        onClick={() => handleHeaderClick(header, "col")}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {excelData.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={`${selectedHeader === rowHeaders[rowIndex] && headerType === "row" ? 'bg-blue-100' : ''}`}
                    >
                      <td
                        className="border border-gray-300 px-4 py-2 cursor-pointer"
                        onClick={() => handleHeaderClick(rowHeaders[rowIndex], "row")}
                      >
                        {rowHeaders[rowIndex]}
                      </td>
                      {row?.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className={`border border-gray-300 px-4 py-2 ${selectedColumnIndex === cellIndex && headerType === "col" ? 'bg-blue-100' : ''}`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {fileName && <p className="mt-2">選択中のファイル: {fileName}</p>}
            <BatchProcessingConfig onProcessBatch={processBatch} llmConfigs={llmConfigs} onFileChange={handleFileChange} selectedFile={selectedFile} selectedLLMs={selectedLLMs} />
          </div>
        )}

        <label htmlFor="researchRequest" className="block text-gray-700 text-m font-bold mb-2">
          リクエスト内容:
        </label>
        <div className="flex items-center">
          <textarea
            id="researchRequest"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={4}
            placeholder="リサーチしたい内容を入力してください"
            value={request}
            onChange={(e) => setRequest(e.target.value)}
          />
          <button
            type="button"
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
            onClick={handleButtonClick}
          >
            ファイルを選択
          </button>
          <input
            type="file"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            ref={fileInputRef}
          />
        </div>
      </div>
      <div className="mb-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
          type="button"
          onClick={handleGenerateVariations}
        >
          言い換えを生成
        </button>
        <div className="flex flex-wrap gap-2">
          {queryVariations.map((query, index) => (
            <button
              key={index}
              className={`border rounded px-2 py-1 text-sm ${selectedQueries.includes(query) ? 'bg-blue-200 border-blue-500' : 'border-gray-300'}`}
              onClick={() => handleQuerySelection(query)}
            >
              {query}
            </button>
          ))}
        </div>
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
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">エラー!</strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {!selectedFile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {llmConfigs.map((llm) => (
            <div key={llm.id}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">{llm.name}</h2>
                {/* 表示チェックボックスは削除 */}
              </div>
              {selectedLLMs.includes(llm.id) && (
                <div className="border p-4 rounded shadow-md">
                  <ReactMarkdown className="prose max-w-full">{llmResponses[llm.id]}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {selectedFile && (
        <BatchProcessingLog logs={batchLogs} />
      )}
    </div>
  );
};

export default ResearchAIPage;
