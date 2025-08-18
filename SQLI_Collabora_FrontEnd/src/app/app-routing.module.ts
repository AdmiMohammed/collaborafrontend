import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ConfirmEmailComponent } from './components/auth/confirm-email/confirm-email.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
import { HomeComponent } from './components/home/home.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
import { DashboardPageComponent } from './modules/dashboard-page/dashboard-page.component';
import { ProfileComponent } from './modules/profile/profile.component';
import { MainDashComponent } from './modules/main-dash/main-dash.component';
import { ProjectPageComponent } from './modules/project-page/project-page.component';
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'confirm-email', component: ConfirmEmailComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
   { path: 'home', component: HomeComponent },
   {
     path : 'dashboard', component: DashboardPageComponent,
     children: [
      { path: '', component: MainDashComponent },
      { path: 'profile', component: ProfileComponent }
     ]
    
    },
    {path: 'projects/:id', component: ProjectPageComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }