import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, take } from 'rxjs';
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

  constructor(private http: HttpClient, private userService: UserService) {}

  getAll(): Observable<ProjectReadDto[]> {
    return this.userService.getCurrentUser().pipe(
      switchMap((user) => {
        const userId = user.id;
        return this.http.get<ProjectReadDto[]>(`${this.apiBase}/user/${userId}`);
      })
    );
  }

    create(dto: Omit<ProjectCreateDto, 'createdBy'>): Observable<ProjectReadDto> {
    return this.userService.getCurrentUser().pipe(
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
