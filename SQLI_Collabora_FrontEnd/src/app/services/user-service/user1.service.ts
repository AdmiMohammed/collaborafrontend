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
@Injectable({
  providedIn: 'root'
})
export class User1Service {

  private apiUrl : string = 'http://localhost:5205/api/User';
  constructor(private http: HttpClient) { }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
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
                profilePictureUrl: u.profilePictureUrl?.trim() ?? null,
              }))
          )
        )
      ),
      catchError(() => of([]))
    );
  }
    /** Helper pratique : juste l’ID du courant */
  getCurrentUserId(): Observable<number> {
    return this.getCurrentUser().pipe(map(u => u.id));
  }
}
