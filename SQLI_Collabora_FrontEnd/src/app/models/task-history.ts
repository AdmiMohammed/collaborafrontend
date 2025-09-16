export interface TaskHistory {
    id: number;
    taskId: number;
    changeDate: string;
    changeType: string;
    description: string;
    changedBy: string;
    oldValue: string | null;
    newValue: string | null;
}
