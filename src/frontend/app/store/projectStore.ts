// src/frontend/app/store/projectStore.ts
import { create } from 'zustand';

export interface SessionItem {
  session_title: string;
  session_id: number;
  latest_timestamp: string;
}

interface Project {
  id: number;
  customer_name: string;
  issues: string;
  is_archived: boolean;
  bpmn_xml: string;
  stage: string;
  category: string;
  slack_channel_id: string;
  slack_tag: string;
  box_folder_id: string;
  box_folder_path: string;
  schedule: string;
}

interface Task {
  title: string;
  tag: '新規作成' | '更新' | 'クローズ' | '無視';
  assignee: string;
  start_date: string;
  due_date: string;
  detail: string;
}

interface SlackChannel {
  id: string;
  name: string;
}

interface ProjectSlackLink {
  project_id: number;
  slack_channel_id: string;
}

interface UploadedFile {
  filename: string;
  filepath: string;
  project_id: number;
}

export interface SelectionOption {
  value: string;
  label: string;
  type: 'file' | 'slack' | 'thread';
}

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  slackChannels: SlackChannel[];
  connectedSlackChannels: ProjectSlackLink[];
  selectedSource: SelectionOption | null;
  projectFiles: { [key: number]: UploadedFile[] };
  sessionTitles: SessionItem[];  // 型を変更
  setSessionTitles: (titles: SessionItem[]) => void;
  selectedSession: string | null;
  setSelectedSession: (session: string) => void;
  maskingEnabled: boolean;
  setMaskingEnabled: (value: boolean) => void;
  extractedTasks: Task[];
  setExtractedTasks: (tasks: Task[]) => void;
  setProjects: (projects: Project[]) => void;
  setSelectedProject: (project: Project | null) => void;
  setSlackChannels: (channels: SlackChannel[]) => void;
  setConnectedSlackChannels: (links: ProjectSlackLink[]) => void;
  setSelectedSource: (source: SelectionOption | null) => void;
  setProjectFiles: (projectId: number, files: UploadedFile[]) => void;
  selectedUploadedFiles: string[]; // 選択されたファイル名を保持する状態を追加
  setSelectedUploadedFiles: (files: string[]) => void; // 選択されたファイルを設定する関数を追加
  selectedThreads: string[]; // 選択されたスレッドIDを保持する状態を追加
  setSelectedThreads: (threads: string[]) => void; // 選択されたスレッドを設定する関数を追加
  toggleFileSelection: (filename: string) => void; // ファイル選択をトグルする関数を追加
  toggleThreadSelection: (threadTs: string) => void; // スレッド選択をトグルする関数を追加
}

const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProject: null,
  slackChannels: [],
  connectedSlackChannels: [],
  selectedSource: null,
  projectFiles: {},
  sessionTitles: [],
  setSessionTitles: (titles) => set({ sessionTitles: titles }),
  selectedSession: null,
  setSelectedSession: (session) => set({ selectedSession: session }),
  maskingEnabled: false,
  setMaskingEnabled: (value) => set({ maskingEnabled: value }),
  extractedTasks: [],
  setExtractedTasks: (tasks) => set({ extractedTasks: tasks }),
  setProjects: (projects) => set({ projects }),
  setSelectedProject: (project) => set({ selectedProject: project }),
  setSlackChannels: (channels) => set({ slackChannels: channels }),
  setConnectedSlackChannels: (links) => set({ connectedSlackChannels: links }),
  setSelectedSource: (source) => set({ selectedSource: source }),
  setProjectFiles: (projectId, files) =>
    set((state) => ({
      projectFiles: { ...state.projectFiles, [projectId]: files },
    })),
  selectedUploadedFiles: [], // 初期状態は空の配列
  setSelectedUploadedFiles: (files) => set({ selectedUploadedFiles: files }),
  selectedThreads: [], // 初期状態は空の配列
  setSelectedThreads: (threads) => set({ selectedThreads: threads }),
  toggleFileSelection: (filename: string) => { // ファイル選択トグル関数
    const selectedUploadedFiles = get().selectedUploadedFiles;
    if (selectedUploadedFiles.includes(filename)) {
      set({ selectedUploadedFiles: selectedUploadedFiles.filter(name => name !== filename) });
    } else {
      set({ selectedUploadedFiles: [...selectedUploadedFiles, filename] });
    }
  },
  toggleThreadSelection: (threadTs: string) => { // スレッド選択トグル関数
    const selectedThreads = get().selectedThreads;
    if (selectedThreads.includes(threadTs)) {
      set({ selectedThreads: selectedThreads.filter(id => id !== threadTs) });
    } else {
      set({ selectedThreads: [...selectedThreads, threadTs] });
    }
  },
}));

export default useProjectStore;
