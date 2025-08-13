// src/app/core/services/user.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, switchMap, catchError, of, shareReplay } from 'rxjs';

export interface AppUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  profilePictureUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = 'http://localhost:5205/api/User';

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<AppUser> {
    return this.http.get<AppUser>(`${this.apiUrl}/me`).pipe(shareReplay(1));
  }

  updateUser(userData: Partial<AppUser>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/me`, userData);
  }

  /** Tous les utilisateurs */
  getUsers(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(`${this.apiUrl}/users`);
  }

  /** Tous les utilisateurs SAUF l'utilisateur courant */
  getOtherUsers(): Observable<AppUser[]> {
    return this.getCurrentUser().pipe(
      switchMap(me =>
        this.getUsers().pipe(
          map(users =>
            users
              .filter(u => u.id !== me.id)
              .map(u => ({
                ...u,
                // petit nettoyage si l'API renvoie un \n dans l’URL
                profilePictureUrl: u.profilePictureUrl?.trim() ?? null,
              }))
          )
        )
      ),
      catchError(() => of([])) // évite de casser l’UI si non authentifié
    );
  }
}
