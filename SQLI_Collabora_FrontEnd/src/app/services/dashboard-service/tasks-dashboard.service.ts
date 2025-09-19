import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, map } from 'rxjs';
import { UserService } from '../user-service/user.service';
import { User } from 'src/app/models/user';

export interface TaskDashboardResponse {
  userTasks: {
    id: number;
    title: string;
    board: string;
    project: string;
    status: string;
    priority: string;
    createdAt: string;
    completedAt: string | null;
    deadline: string | null;
    comments: number;
    attachments: number;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class TasksDashboardService {
  private apiUrl = 'http://localhost:5205/api/Dashboard';

  constructor(
    private http: HttpClient,
    private userService: UserService 
  ) {}

  /**
   * Récupère le dashboard pour l'utilisateur courant
   */
  getTasksDashboard(): Observable<TaskDashboardResponse> {
    return this.userService
      .fetchCurrentUser()
      .pipe(
        switchMap((user: User) =>
          this.http.get<TaskDashboardResponse>(
            `${this.apiUrl}/tasks/${user.id}`
          )
        )
      );
  }
}
