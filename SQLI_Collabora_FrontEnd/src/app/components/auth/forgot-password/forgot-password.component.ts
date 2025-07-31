import { Component, Inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  forgotForm: FormGroup;
  isBrowser: boolean;
  windowWidth: number = 0;
  isSubmitted: boolean = false;
  showErrors: boolean = false;
  message: string | null = null;
  isSuccess: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
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
    return this.forgotForm.controls;
  }

  onResize = () => {
    this.windowWidth = window.innerWidth;
  }

  onSubmit() {
    this.showErrors = true;
    
    if (this.forgotForm.valid) {
      this.authService.forgotPassword(this.forgotForm.value).subscribe({
        next: (response) => {
          this.isSubmitted = true;
          this.isSuccess = true;
          this.message = 'Un lien de réinitialisation a été envoyé à votre email.';
        },
        error: (error) => {
          this.isSubmitted = true;
          this.isSuccess = false;
          this.message = error.error?.message || 'Échec de l\'envoi du lien de réinitialisation. Veuillez réessayer.';
          console.error('Forgot password request failed', error);
        }
      });
    }
  }
}