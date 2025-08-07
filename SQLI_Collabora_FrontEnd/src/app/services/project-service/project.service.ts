import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { User1Service } from '../user-service/user1.service';

export interface ProjectMemberDto {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  joinedAt: string;
  profilePictureUrl: string;
}

export interface ProjectReadDto {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  position : number;
  boardCount: number;
  attachmentCount: number;
  totalTasks: number;
  completedTasks: number;
  projectMembers: ProjectMemberDto[];
}

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiBase = 'http://localhost:5205/api/Projects';

  constructor(private http: HttpClient, private user1Service: User1Service) {}

  getAll(): Observable<ProjectReadDto[]> {
    return this.user1Service.getCurrentUser().pipe(
      switchMap((user) => {
        const userId = user.id;
        return this.http.get<ProjectReadDto[]>(`${this.apiBase}/user/${userId}`);
      })
    );
  }
}
