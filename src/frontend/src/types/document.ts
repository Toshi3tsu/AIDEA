// frontend/src/types/document.ts

export interface UploadedFile {
  id: number;
  source_name: string;
  source_path: string;
  processed: boolean;
}

export interface SlackChannel {
  id: string;
  name: string;
}

export interface SlackThread {
  ts: string;
  text: string;
  user: string;
}

export interface SelectionOption {
  value: string;
  label: string;
  type: 'file' | 'slack' | 'thread';
}

export interface Task {
  title: string;
  tag: '新規作成' | '更新' | 'クローズ' | '無視';
  assignee: string;  // 担当者名
  due_date: string;  // 期限
  detail: string;    // 詳細
}

export interface ThreadsByTag {
  tag: string;
  threads: SlackThread[];
}

export interface ManageDocumentsProps {
  selectedProject: any; //  any は避けるべきだが、Props の型定義が不明なので一旦 any で
}