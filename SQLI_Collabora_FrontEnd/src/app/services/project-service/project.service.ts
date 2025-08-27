import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, take } from 'rxjs';
import { User1Service } from '../user-service/user1.service';
import { AttachmentDto, Board, Label, Project, Task, TaskLabel } from 'src/app/models/project';
import * as jsonpatch from 'fast-json-patch';

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
  startDate: string;          // <-- ajout
  estimatedEndDate: string | null; // <-- ajout
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
  startDate: string;          // ISO
  createdBy: number;          // rempli côté front via /me
  estimatedEndDate: string | null; // ISO ou null
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
  private labelApiBase = 'http://localhost:5205/api/label';
  private taskLabelApiBase = 'http://localhost:5205/api/taskLabels';
  private attachmentApiBase = 'http://localhost:5205/api/attachments';

  constructor(private http: HttpClient, private user1Service: User1Service) { }

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

  createTask(taskData: { title: string, position: number, boardId: number }): Observable<Task> {
    return this.user1Service.getCurrentUser().pipe(
      switchMap((user) => {
        return this.http.post<Task>(this.taskApiBase, { ...taskData, createdBy: user.id })
      })
    )
  }

  createColumn(columnData: { name: string; projectId: number, position: number }) {
    return this.http.post<Board>(this.boardApiBase, columnData);
  }

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

  updateTask(taskId: number, original: any, updated: any): Observable<any> {
    // Automatically compute the patch
    const patchPayload = jsonpatch.compare(original, updated);

    return this.http.patch(
      `${this.taskApiBase}/${taskId}`,
      patchPayload,
      { headers: { 'Content-Type': 'application/json-patch+json' } }
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
}
