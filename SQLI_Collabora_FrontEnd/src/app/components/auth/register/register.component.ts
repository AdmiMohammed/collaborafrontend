import { Component, Inject, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  isBrowser: boolean;
  windowWidth: number = 0;
  showErrors: boolean = false;
  showPassword: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.initializeForm();
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.windowWidth = window.innerWidth;
      window.addEventListener('resize', this.onResize);
      // Ajouter un écouteur pour réinitialiser showErrors lorsque le formulaire change
      this.registerForm.valueChanges.subscribe(() => {
        this.showErrors = false;
      });
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener('resize', this.onResize);
    }
  }

  initializeForm(): void {
    this.registerForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      firstName: ['', [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-ZÀ-ÿ '-]+$/)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-ZÀ-ÿ '-]+$/)
      ]]
    });
  }

  get f() {
    return this.registerForm.controls;
  }

  onResize = () => {
    this.windowWidth = window.innerWidth;
  }

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.showErrors = true;
    
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: (response) => {
          console.log('Inscription réussie', response);
          this.router.navigate(['/confirm-email']);
        },
        error: (error) => {
          console.error('Échec de l\'inscription', error);
          if (error.error?.email) {
            this.registerForm.get('email')?.setErrors({ serverError: error.error.email });
          }
        }
      });
    }
  }
}