import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl : string = 'http://localhost:5205/api/User';

   // BehaviorSubject avec valeur initiale "null" (pas encore de user)
  private currentUserSubject = new BehaviorSubject<any>(null);

  // Observable que les composants peuvent écouter
  currentUser$ = this.currentUserSubject.asObservable();
  constructor(private http: HttpClient) { }

  // getCurrentUser(): Observable<any> {
  //   return this.http.get(`${this.apiUrl}/me`);
  // }

  // updateUser(userData: any): Observable<any> {
  //   return this.http.patch(`${this.apiUrl}/me`, userData); // PUT ou PATCH selon ton backend
  // }

  /** Charge l'utilisateur depuis l'API et le met dans BehaviorSubject */
  fetchCurrentUser(): Observable<User> {
  return this.http.get<User>(`${this.apiUrl}/me`).pipe(
    tap((user: User) => this.currentUserSubject.next(user))
  );
}

updateUser(userData: Partial<User>): Observable<User> {
  return this.http.patch<User>(`${this.apiUrl}/me`, userData).pipe(
    tap((updatedUser: User) => this.currentUserSubject.next(updatedUser))
  );
}

  /** Permet d'accéder directement à la dernière valeur */
  getCurrentUserValue() {
    return this.currentUserSubject.value;
  }
}

  


