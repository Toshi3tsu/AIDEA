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
  assignee: string;
  start_date: string;
  due_date: string;
  detail: string;
  tag: '新規作成' | '更新' | 'クローズ' | '無視' | '';
}

export interface ThreadsByTag {
  tag: string;
  threads: SlackThread[];
}

export interface ManageDocumentsProps {
  selectedProject: any; //  any は避けるべきだが、Props の型定義が不明なので一旦 any で
}