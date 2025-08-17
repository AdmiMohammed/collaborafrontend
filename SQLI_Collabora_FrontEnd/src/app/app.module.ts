import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ConfirmEmailComponent } from './components/auth/confirm-email/confirm-email.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
import { AuthService } from './services/auth.service';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { DashboardPageComponent } from './modules/dashboard-page/dashboard-page.component';
import { TopbarComponent } from './shared/components/topbar/topbar.component';
import { ProfileComponent } from './modules/profile/profile.component';
import { MainDashComponent } from './modules/main-dash/main-dash.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ProjectCardComponent } from './shared/components/project-card/project-card.component';
import { SortableDirective } from './sortable.directive';
import { ProjectPageComponent } from './modules/project-page/project-page.component';
import { BoardHeaderComponent } from './components/project/board-header/board-header.component';
import { ColumnComponent } from './components/project/column/column.component';
import { TaskCardComponent } from './components/project/task-card/task-card.component';
import { AddMemberModalComponent } from './components/project/add-member-modal/add-member-modal.component';
import { AvatarComponent } from './shared/components/avatar/avatar.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    ConfirmEmailComponent,
    ResetPasswordComponent,
    ForgotPasswordComponent,
    SidebarComponent,
    DashboardPageComponent,
    TopbarComponent,
    ProfileComponent,
    MainDashComponent,
    ProjectCardComponent,
    SortableDirective,
    ProjectPageComponent,
    BoardHeaderComponent,
    ColumnComponent,
    TaskCardComponent,
    AddMemberModalComponent,
    AvatarComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    FormsModule,
    ToastrModule.forRoot({
      timeOut: 5000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      closeButton: true,
      progressBar: true
    })
  ],
  providers: [
    AuthService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }