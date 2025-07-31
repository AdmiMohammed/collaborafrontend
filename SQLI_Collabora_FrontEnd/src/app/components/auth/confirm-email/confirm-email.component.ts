import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-confirm-email',
  templateUrl: './confirm-email.component.html',
  styleUrls: ['./confirm-email.component.css']
})
export class ConfirmEmailComponent implements OnInit {
  isBrowser: boolean;
  windowWidth: number = 0;
  message: string | null = null;
  isSuccess: boolean = false;
  isConfirmed: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.windowWidth = window.innerWidth;
      window.addEventListener('resize', () => {
        this.windowWidth = window.innerWidth;
      });
    }

    const email = this.route.snapshot.queryParamMap.get('email');
    const token = this.route.snapshot.queryParamMap.get('token');

    if (email && token) {
      this.authService.confirmEmail(email, token).subscribe({
        next: (response: string) => {
          this.isSuccess = true;
          this.isConfirmed = true;
          this.message = 'Votre confirmation est réussie !';
          setTimeout(() => this.router.navigate(['/login']), 3000);
        },
        error: (err) => {
          this.isSuccess = false;
          this.isConfirmed = true;
          this.message = typeof err.error === 'string' ? err.error : 'Échec de la confirmation de l\'email. Veuillez réessayer.';
        }
      });
    }
  }
}