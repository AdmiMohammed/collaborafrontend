import { ProjectMemberDto } from "../services/project-service/project.service";

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
  labels: Label[];
}

export interface Board {
  id: number;
  name: string;
  position: number;
  tasks: Task[];
  isArchived?: boolean; 
}


export interface Task {
  id: number;
  title: string;
  description: string | null;
  assignedTo: number | null;
  assignedToName?: string | null;
  createdBy: number;
  deadline: string | null;
  priority: "High" | "Medium" | "Low" | null;
  position: number;
  // taskLabels: TaskLabel[];
  boardId: number;
  // isArchived?: boolean;
  taskLabels?: TaskLabel[];
  attachments?: AttachmentDto[];
  comments?: Comment[];
  isArchived: boolean;
}

export interface TaskLabel{
  taskId: number;
  labelId: number;
  label: Label;
}

export interface Label{
  id?: number;
  name: string;
  color: string;
}

export interface AttachmentDto {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  contentType?: string;
  uploadDate: string;
  uploadedBy: number;
}

export interface Comment {
  id: number;
  content: string;
  taskId: number;
  taskTitle: string;
  userId: number;
  userFullName: string;
  createdAt: string; 
  modifiedAt?: string | null;
}