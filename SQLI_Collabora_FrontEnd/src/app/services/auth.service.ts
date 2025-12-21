import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  register(request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, request);
  }

  login(request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, request);
  }

  forgotPassword(request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, request);
  }

  resetPassword(request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, request);
  }

  confirmEmail(email: string, token: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/confirm-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`, {
      responseType: 'text'
    });
  }

  validateToken(token: string): Observable<boolean> {
    return this.http.post(`${this.apiUrl}/validate-token`, { token }).pipe(
      map((response: any) => response.isValid || false)
    );
  }
}