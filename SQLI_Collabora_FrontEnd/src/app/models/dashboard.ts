export interface ProjectBar {
  projectName: string;
  high: number;
  medium: number;
  low: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface DoneTrend {
  date: string;
  doneCount: number;
}

export interface UserTask {
  id: number;
  title: string;
  board: string;
  project: string;
  status: string;
  priority: string;
  createdAt: string;
  deadline?: string | null;
  comments: number;
  attachments: number;
}

export interface DashboardResponse {
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  blockedTasks: number;
  averageTasksPerUser: number;
  statusDistribution: StatusDistribution[];
  projectBars: ProjectBar[];
  doneTrend: DoneTrend[];
  userTasks: UserTask[];
}
