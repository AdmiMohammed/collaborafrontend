import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, take, tap } from 'rxjs';
import { User1Service } from '../user-service/user1.service';
import { Board, Project, ProjectCreateDto, ProjectMemberDto, ProjectReadDto, ProjectTaskReadDto, Task } from 'src/app/models/project';


@Injectable({
  providedIn: 'root',
})

export class ProjectService {
  private apiBase = 'http://localhost:5205/api/Projects';
  private boardApiBase = 'http://localhost:5205/api/boards';
  private taskApiBase = 'http://localhost:5205/api/projecttasks';

  constructor(private http: HttpClient, private user1Service: User1Service) { }

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

  deleteProject(projectId: number) {
    return this.http.delete<Project>(`${this.apiBase}/${projectId}`)
  }


  bulkAddMembers(projectId: number, userIds: { userId: number }[]) {
    return this.http.post<ProjectMemberDto>(`${this.apiBase}/${projectId}/members/bulk-add`, userIds)
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

}
