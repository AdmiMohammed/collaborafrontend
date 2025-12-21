import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { User } from 'src/app/models/user';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/User`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap(user => this.currentUserSubject.next(user)),
      catchError(err => {
        console.error('Erreur lors de la récupération de l\'utilisateur :', err);
        this.clearCurrentUser();
        return throwError(() => err);
      })
    );
  }

  updateUser(userData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/me`, userData).pipe(
      tap(updatedUser => this.currentUserSubject.next(updatedUser)),
      catchError(err => {
        console.error('Erreur lors de la mise à jour de l\'utilisateur :', err);
        return throwError(() => err);
      })
    );
  }

  uploadAvatar(fileData: FormData): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.apiUrl}/me/avatar`, fileData).pipe(
      tap(res => {
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
          this.currentUserSubject.next({
            ...currentUser,
            profilePictureUrl: res.url
          });
        }
      })
    );
  }

  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }


  // //added by me alae
  // getAllUsers(){
  //   return this.http.get<User[]>(`${this.apiUrl}/users`)}
  clearCurrentUser() {
    this.currentUserSubject.next(null);
  }

  logout() {
    localStorage.removeItem('token');
    this.clearCurrentUser();
    this.router.navigate(['/login']);
  }
}
