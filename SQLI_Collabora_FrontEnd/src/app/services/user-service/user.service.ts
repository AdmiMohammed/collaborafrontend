import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl : string = 'http://localhost:5205/api/User';
  constructor(private http: HttpClient) { }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
  }

  updateUser(userData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/me`, userData); // PUT ou PATCH selon ton backend
  }
}

  


