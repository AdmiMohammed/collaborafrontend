import { Component, Inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetForm!: FormGroup;
  token: string | null;
  isBrowser: boolean;
  windowWidth: number = 0;
  isSubmitted: boolean = false;
  showErrors: boolean = false;
  message: string | null = null;
  isSuccess: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.token = this.route.snapshot.queryParamMap.get('token');
    this.initializeForm();
  }

  ngOnInit(): void {
    if (!this.token) {
      this.message = 'Jeton de réinitialisation invalide ou manquant.';
      this.isSuccess = false;
      this.resetForm.disable();
    }
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

  initializeForm(): void {
    this.resetForm = this.fb.group({
      token: [this.token, Validators.required],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100)
      ]]
    }, { validators: this.passwordMatchValidator });
  }

  get f() {
    return this.resetForm.controls;
  }

  onResize = () => {
    this.windowWidth = window.innerWidth;
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('newPassword')?.value === form.get('confirmPassword')?.value 
      ? null 
      : { mismatch: true };
  }

  toggleShowNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    this.showErrors = true;
    
    if (this.resetForm.valid) {
      const payload = {
        token: this.resetForm.get('token')?.value,
        newPassword: this.resetForm.get('newPassword')?.value,
        confirmPassword: this.resetForm.get('confirmPassword')?.value
      };

      this.authService.resetPassword(payload).subscribe({
        next: (response) => {
          this.isSubmitted = true;
          this.isSuccess = true;
          this.message = 'Votre mot de passe a été réinitialisé avec succès !';
          setTimeout(() => this.router.navigate(['/login']), 3000);
        },
        error: (error) => {
          this.isSubmitted = true;
          this.isSuccess = false;
          if (error.error?.errors) {
            const errorMessages = Object.values(error.error.errors).flat() as string[];
            this.message = errorMessages.join(' ');
          } else {
            this.message = error.error?.message || 'Échec de la réinitialisation du mot de passe. Veuillez réessayer.';
          }
          console.error('Password reset failed', error);
        }
      });
    } else {
      this.resetForm.markAllAsTouched();
    }
  }
}