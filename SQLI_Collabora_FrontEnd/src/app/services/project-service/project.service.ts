import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, take } from 'rxjs';
import { User1Service } from '../user-service/user1.service';
import { Board, Project, Task } from 'src/app/models/project';
import { TaskHistory } from 'src/app/models/task-history';

export interface ProjectMemberDto {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  joinedAt?: string;
  profilePictureUrl?: string | null;
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
  totalTasks: number;
  completedTasks: number;
  projectMembers: ProjectMemberDto[];
}

export interface ProjectCreateDto {
  name: string;
  description: string;
  startDate: string;         
  createdBy: number;          
  estimatedEndDate: string | null; 
  templateId: number;
  initialBoardCount: number;
  memberIds: number[];
}
@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiBase = 'http://localhost:5205/api/Projects';
  private boardApiBase = 'http://localhost:5205/api/boards';
  private taskApiBase = 'http://localhost:5205/api/projecttasks';

  constructor(private http: HttpClient, private user1Service: User1Service) { }

  // ***************** projets & membres *******************
  getAll(): Observable<ProjectReadDto[]> {
    return this.user1Service.getCurrentUser().pipe(
      switchMap((user) => {
        const userId = user.id;
        return this.http.get<ProjectReadDto[]>(`${this.apiBase}/user/${userId}`);
      })
    );
  }

  //added things
  getProjectDetails(projectId: number): Observable<Project> {
    return this.user1Service.getCurrentUser().pipe(
      switchMap((user) => {
        const userId = user.id;
        return this.http.get<Project>(`${this.apiBase}/user/${userId}/${projectId}`)
      })
    )
  }

  create(dto: Omit<ProjectCreateDto, 'createdBy'>): Observable<ProjectReadDto> {
    return this.user1Service.getCurrentUser().pipe(
      take(1),
      switchMap(user =>
        this.http.post<ProjectReadDto>(
          this.apiBase,
          { ...dto, createdBy: user.id },
        )
      )
    );
  }

  updateProjectName(newName: string, projectId: number) {
    const patchPayload = [
      { op: 'replace', path: '/name', value: newName }
    ];

    return this.http.patch<ProjectReadDto>(
      `${this.apiBase}/${projectId}`,
      patchPayload,
      {
        headers: { 'Content-Type': 'application/json-patch+json' }
      }
    );
  }
  deleteProject(projectId: number) {
    return this.http.delete<Project>(`${this.apiBase}/${projectId}`)
  }


  bulkAddMembers(projectId: number, userIds: { userId: number }[]) {
    return this.http.post<ProjectMemberDto>(`${this.apiBase}/${projectId}/members/bulk-add`, userIds)
  }

  bulkRemoveMembers(projectId: number, userIds: number[]) {
    return this.http.post<ProjectMemberDto>(`${this.apiBase}/${projectId}/members/bulk-remove`, userIds)
  }

  getProjectHistory(projectId: number): Observable<TaskHistory[]> {
    return this.http.get<TaskHistory[]>(`http://localhost:5205/api/projects/${projectId}/history`);
  }

  // ********************* colonnes *********************
  updateColumnName(newName: string, columnId: number) {
    const patchPayload = [
      { op: 'replace', path: '/name', value: newName }
    ];

    return this.http.patch<Board>(
      `${this.boardApiBase}/${columnId}`,
      patchPayload,
      {
        headers: { 'Content-Type': 'application/json-patch+json' }
      }
    );
  }

  createColumn(columnData: { name: string; projectId: number, position: number }) {
    return this.http.post<Board>(this.boardApiBase, columnData);
  }
  
  archiveBoard(boardId: number): Observable<void> {
    return this.http.patch<void>(`${this.boardApiBase}/${boardId}/archive`, {});
  }

  restoreBoard(boardId: number): Observable<void> {
    return this.http.patch<void>(`${this.boardApiBase}/${boardId}/restore`, {});
  }
getArchivedTasksForProject(projectId: number): Observable<Task[]> {
  return this.http.get<Task[]>(`${this.taskApiBase}/archived-for-project/${projectId}`);
}
  getArchivedColumns(projectId: number) {
  return this.http.get<Board[]>(`${this.boardApiBase}/archived/${projectId}`);
}

deleteColumn(columnId: number) {
  return this.http.delete<void>(`${this.boardApiBase}/${columnId}`);
}


  // **************** tâches ****************
  createTask(taskData: { title: string, position: number, boardId: number }): Observable<Task> {
    return this.user1Service.getCurrentUser().pipe(
      switchMap((user) => {
        return this.http.post<Task>(this.taskApiBase, { ...taskData, createdBy: user.id })
      })
    )
  }

  updateTaskName(newTitle: string, taskId: number) {
    const patchPayload = [
      { op: 'replace', path: '/title', value: newTitle }
    ];

    return this.http.patch<Task>(
      `${this.taskApiBase}/${taskId}`,
      patchPayload,
      {
        headers: { 'Content-Type': 'application/json-patch+json' }
      }
    );
  }

  getArchivedTasks(projectId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.taskApiBase}/archived/${projectId}`);
  }

  restoreTask(taskId: number): Observable<void> {
    return this.http.put<void>(`${this.taskApiBase}/${taskId}/unarchive`, {});
  }

  deleteTask(taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.taskApiBase}/${taskId}`);
  }
  archivedTask(taskId: number): Observable<void> {
    return this.http.put<void>(`${this.taskApiBase}/${taskId}/archive`, {});
  }
}
