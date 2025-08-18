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