import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private toastr: ToastrService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Une erreur s\'est produite. Veuillez réessayer.';
        
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Erreur : ${error.error.message}`;
        } else {
          // Server-side error (handle plain text or JSON)
          if (error.status === 0) {
            errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion réseau.';
          }
          else if (error.status === 401 && !req.url.includes('/login')) {
            errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.';
            
            // Clear tokens
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');

            // Redirect to login
            this.router.navigate(['/login']);
          }else {
            errorMessage = typeof error.error === 'string' ? error.error : error.error?.message || `Erreur ${error.status} : ${error.statusText}`;
            if (error.error?.error === 'EmailAlreadyExistsException') {
              errorMessage = "L'email est déjà utilisé.";
            }
          }
        }

        // Display the error with Toastr
        this.toastr.error(errorMessage, 'Erreur');

        // Rethrow the error for component handling
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}