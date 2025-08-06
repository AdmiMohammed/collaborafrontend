import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { UserService } from '../user-service/user.service';

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

  constructor(private http: HttpClient, private userService: UserService) {}

  getAll(): Observable<ProjectReadDto[]> {
    return this.userService.getCurrentUser().pipe(
      switchMap((user) => {
        const userId = user.id;
        return this.http.get<ProjectReadDto[]>(`${this.apiBase}/user/${userId}`);
      })
    );
  }
}
