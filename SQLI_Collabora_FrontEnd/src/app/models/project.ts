export interface ProjectMemberDto {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  joinedAt?: string;
  profilePictureUrl?: string | null;
}

export interface Project {
  id: number;
  name: string;
  description? : string;
  startDate: Date;
  estimatedEndDate: Date;
  createdBy: number;
  members: ProjectMemberDto[];
  projectTasks: Task[];
  columns: Board[];
}

export interface Board {
  id: number;
  name: string;
  position: number;
  tasks: Task[];
}

export interface Task {
  id: number;
  title: string;
  description: string;
  assignedTo: number;
  assignedToName: string;
  deadline: Date;
  priority: "High" | "Medium" | "Low";
  position: number;
  taskLabels: TaskLabel[];
}

export interface TaskLabel{
  taskId: number;
  labelId: number;
  label: Label;
}

export interface Label{
  name: string;
  color: string;
}

export interface ProjectTaskReadDto {
  id: number;
  title: string;
  description?: string | null;
  boardId: number;
  boardName: string;
  projectId: number;          
  createdBy: number;
  createdByName: string;
  assignedTo?: number | null;
  assignedToName?: string | null;
  createdAt: string;           // ISO
  completedAt: string | null;           // ISO
  deadline?: string | null;    // ISO
  priority: string;            // "Low" | "Medium" | "High" (selon ton enum)
  position: number;
  isArchived: boolean;
  taskLabels: TaskLabel[];
}
export interface ProjectReadDto {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  createdBy: number;
  startDate: string;
  estimatedEndDate: string | null; 
  position: number;
  boardCount: number;
  attachmentCount: number;
  totalRealTasks: number;
  completedRealTasks: number;
  totalTasks: number;
  projectMembers: ProjectMemberDto[];
}

export interface ProjectCreateDto {
  name: string;
  description: string;
  startDate: string;          // ISO
  createdBy: number;          // rempli côté front via /me
  estimatedEndDate: string | null; // ISO ou null
  templateId: number;
  initialBoardCount: number;
  memberIds: number[];
}