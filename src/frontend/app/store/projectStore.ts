// src/frontend/app/store/projectStore.ts
import { create } from 'zustand';

interface Project {
  id: number;
  customer_name: string;
  issues: string;
  has_flow_flag: boolean;
  bpmn_xml: string;
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

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  slackChannels: SlackChannel[];
  connectedSlackChannels: ProjectSlackLink[];
  selectedSource: SelectionOption | null;
  projectFiles: { [key: number]: UploadedFile[] }; // プロジェクトIDごとのファイルリスト
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