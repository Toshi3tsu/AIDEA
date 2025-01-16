// src/frontend/app/store/projectStore.ts
import { create } from 'zustand';

interface Project {
  id: number;
  customer_name: string;
  issues: string;
  has_flow_flag: boolean;
  bpmn_xml: string;
}

interface Task {
  title: string;
  tag: '新規作成' | '更新' | 'クローズ' | '無視';
  assignee: string;  // 担当者名
  due_date: string;  // 期限
  detail: string;    // 詳細
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

interface SelectionOption {
  value: string;
  label: string;
  type: 'file' | 'slack';
}

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  slackChannels: SlackChannel[];
  connectedSlackChannels: ProjectSlackLink[];
  selectedSource: SelectionOption | null;
  projectFiles: { [key: number]: UploadedFile[] };
  sessionTitles: string[];
  setSessionTitles: (titles: string[]) => void;
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
}

const useProjectStore = create<ProjectState>((set) => ({
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
  maskingEnabled: true, // デフォルトで有効
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
}));

export default useProjectStore;