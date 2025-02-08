// frontend/src/types/chat.ts
export interface ChatResponse {
  response: string;
  source_name?: string | string[] | null;
  source_path?: string | null;
  source_ids?: string[] | null;
}

export interface MessageItem {
  sender: string;
  message: string;
  timestamp: string;
  source_name?: string | string[] | null | undefined;
  source_path?: string | null;
  source_ids?: string[] | null;
}

// chatRequest の型定義
export interface ChatRequest {
  session_id: number;
  project_id: number;
  message: string;
  model: string;
  source_type: string;
  source_id: string | null; // string か null を許容する
  source_content: string | null;
  source_name: string | string[] | null;
  source_path: string | null;
}