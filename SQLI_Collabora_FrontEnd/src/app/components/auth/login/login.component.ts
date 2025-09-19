import { Component, Inject, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { UserService } from 'src/app/services/user-service/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isBrowser: boolean;
  windowWidth: number = 0;
  showErrors: boolean = false;
  showPassword: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loginForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8)
      ]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.windowWidth = window.innerWidth;
      window.addEventListener('resize', this.onResize);
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener('resize', this.onResize);
    }
  }

  get f() {
    return this.loginForm.controls;
  }

  onResize = () => {
    this.windowWidth = window.innerWidth;
  }

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.showErrors = true;
    
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          const token = response.token;

          if(token) {
            localStorage.setItem('token', token);
             // Met à jour le BehaviorSubject avec le bon utilisateur
            this.userService.fetchCurrentUser().subscribe({
            next: () => this.router.navigate(['/home']),
            error: () => this.router.navigate(['/home']) // même si erreur, on navigue
          });
          }
        },
        error: (error) => {
          console.error('Échec de la connexion', error);
          if (error.error?.email) {
            this.loginForm.get('email')?.setErrors({ serverError: error.error.email });
          }
          if (error.error?.password) {
            this.loginForm.get('password')?.setErrors({ serverError: error.error.password });
          }
        }
      });
    }
  }
}