import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, take, tap } from 'rxjs';
import { User1Service } from '../user-service/user1.service';

import { TaskHistory } from 'src/app/models/task-history';

import { AttachmentDto, Board, Label, Project, Task, TaskLabel, Comment, ProjectTaskReadDto, ProjectReadDto } from 'src/app/models/project';
import * as jsonpatch from 'fast-json-patch';
import { environment } from 'src/environments/environment';

export interface ProjectMemberDto {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  joinedAt?: string;
  profilePictureUrl?: string | null;
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

export interface CreateCommentDto {
  content: string;
  taskId: number;
  userId: number;
}

export interface UpdateCommentDto {
  content: string;
}

@Injectable({
  providedIn: 'root',
})

export class ProjectService {
  private apiBase = `${environment.apiUrl}/api/Projects`;
  private boardApiBase = `${environment.apiUrl}/api/boards`;
  private taskApiBase = `${environment.apiUrl}/api/projecttasks`;
  private labelApiBase = `${environment.apiUrl}/api/label`;
  private taskLabelApiBase = `${environment.apiUrl}/api/taskLabels`;
  private attachmentApiBase = `${environment.apiUrl}/api/attachments`;
  private commentApiBase = `${environment.apiUrl}/api/comments`;

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
  getMyAssignedTasksByDeadline(): Observable<ProjectTaskReadDto[]> {
    return this.user1Service.getCurrentUser().pipe(
      take(1),
      switchMap(user =>
        this.http.get<ProjectTaskReadDto[]>(
          `${this.taskApiBase}/user/${user.id}/assigned-by-deadline`
        )
      )
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



  getProjectHistory(projectId: number): Observable<TaskHistory[]> {
    return this.http.get<TaskHistory[]>(`${environment.apiUrl}/api/projects/${projectId}/history`);
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
  getArchivedTasksForProject(projectId: number): Observable<Task[]> {
  return this.http.get<Task[]>(`${this.taskApiBase}/archived-for-project/${projectId}`);
}
  updateTask(taskId: number, original: any, updated: any): Observable<any> {
    // Automatically compute the patch
    const patchPayload = jsonpatch.compare(original, updated);

    return this.http.patch(
      `${this.taskApiBase}/${taskId}`,
      patchPayload,
      { headers: { 'Content-Type': 'application/json-patch+json' } }
    );
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

  createLabel(labelData: { name: string, color: string, projectId: number }) {
    return this.http.post<Label>(`${this.labelApiBase}`, labelData);
  }

  deleteLabel(labelId: number) {
    return this.http.delete<Label>(`${this.labelApiBase}/${labelId}`)
  }

  updateLabel(labelId: number, labelData: { name: string, color: string, projectId: number }) {
    return this.http.put<Label>(`${this.labelApiBase}/${labelId}`, labelData)
  }

  createTaskLabelMapping(taskId: number, labelId: number) {
    return this.http.post<TaskLabel>(`${this.taskLabelApiBase}`, { taskId: taskId, labelId: labelId });
  }

  deleteTaskLabelMapping(taskId: number, labelId: number) {
    return this.http.delete<TaskLabel>(`${this.taskLabelApiBase}/${taskId}/${labelId}`)
  }

  //attachments
  getTaskAttachments(taskId: number): Observable<AttachmentDto[]> {
    return this.http.get<AttachmentDto[]>(`${this.attachmentApiBase}/task/${taskId}`);
  }

  uploadAttachment(taskId: number, file: File): Observable<AttachmentDto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<AttachmentDto>(`${this.attachmentApiBase}/${taskId}`, formData);
  }

  deleteAttachment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.attachmentApiBase}/${id}`);
  }

  reorderTask(taskId: number, dto: {newBoardId: number, newPosition: number}): Observable<void> {
    return this.http.post<void>(`${this.taskApiBase}/${taskId}/reorder`, dto);
  }

  reorderColumn(projectId: number, columnId: number, newPosition: number): Observable<any> {
    return this.http.post(`${this.boardApiBase}/${projectId}/${columnId}/reorder?newPosition=${newPosition}`, {});
  }


  // Fetch comments for a task
  getCommentsByTaskId(taskId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.commentApiBase}/task/${taskId}`);
  }

  bulkRemoveMembers(projectId: number, userIds: number[]) {
    return this.http.post<ProjectMemberDto>(`${this.apiBase}/${projectId}/members/bulk-remove`, userIds)
  }
create(dto: Omit<ProjectCreateDto, 'createdBy'>): Observable<ProjectReadDto> {
  return this.user1Service.getCurrentUser().pipe(
    take(1),
    switchMap(user => {
      const body = { ...dto, createdBy: user.id };
      console.log('[POST /api/projects] payload envoyé =', body); // <-- c’est CE log qui compte
      return this.http.post<ProjectReadDto>(this.apiBase, body);
    })
  );
}

  // Create a new comment
  createComment(commentData: CreateCommentDto): Observable<Comment> {
    return this.user1Service.getCurrentUser().pipe(
      switchMap((user) =>
        this.http.post<Comment>(this.commentApiBase, {
          ...commentData,
          userId: user.id,
        })
      )
    );
  }

  // Update an existing comment
  updateComment(commentId: number, commentData: UpdateCommentDto): Observable<Comment> {
    return this.http.put<Comment>(`${this.commentApiBase}/${commentId}`, commentData);
  }

  // Delete a comment
  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.commentApiBase}/${commentId}`);
  }
}
