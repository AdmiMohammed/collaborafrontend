import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Public
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ConfirmEmailComponent } from './components/auth/confirm-email/confirm-email.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';

// App shell
import { AppLayoutComponent } from './modules/app-layout/app-layout.component';

// Pages “app”
import { ProfileComponent } from './modules/profile/profile.component';
import { DashboardPageComponent } from './modules/dashboard-page/dashboard-page.component';
import { ProjectPageComponent } from './modules/project-page/project-page.component';
import { ProjectsPageComponent } from './modules/projects-page/projects-page.component';

const routes: Routes = [
  // Public
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'confirm-email', component: ConfirmEmailComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  // App (protégé idéalement par un guard)
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      { path: 'home', component: DashboardPageComponent },
      { path: 'profile', component: ProfileComponent },          // /profile
      { path: 'projects', component: ProjectsPageComponent },    // /projects
    ]
  },
  { path: 'projects/:id', component: ProjectPageComponent }, // /projects/123
  // Fallback
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }