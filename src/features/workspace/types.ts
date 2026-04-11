export type WorkspaceUser = {
  username: string;
  loginId: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number | null;
  tone: "backlog" | "active" | "paused" | "done" | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type Task = {
  id: string;
  title: string;
  note: string | null;
  dueDate: string | null;
  sortOrder: number | null;
  done: boolean;
  projectId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type StoredFile = {
  path: string;
  size?: number;
  lastModified?: string | null;
  uploading?: boolean;
};

export type WorkspacePageData = {
  user: WorkspaceUser;
  projects: Project[];
  tasks: Task[];
  selectedProjectId: string | null;
  projectFiles: StoredFile[];
};
