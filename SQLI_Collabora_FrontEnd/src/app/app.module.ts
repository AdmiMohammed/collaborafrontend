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
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ProjectCardComponent } from './components/project/project-card/project-card.component';
import { SortableDirective } from './sortable.directive';
import { ProjectWizardComponent } from './components/project/project-wizard/project-wizard.component';
import { ProjectCardSkeletonComponent } from './components/project/project-card-skeleton/project-card-skeleton.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProjectPageComponent } from './modules/project-page/project-page.component';
import { BoardHeaderComponent } from './components/project/board-header/board-header.component';
import { ColumnComponent } from './components/project/column/column.component';
import { TaskCardComponent } from './components/project/task-card/task-card.component';
import { AvatarComponent } from './shared/components/avatar/avatar.component';
import { AddMemberModalComponent } from './components/project/add-member-modal/add-member-modal.component';
import { ProjectsPageComponent } from './modules/projects-page/projects-page.component';
import { AppLayoutComponent } from './modules/app-layout/app-layout.component';
import { NgChartsModule } from 'ng2-charts';
import { ProjectsDashboardComponent } from './components/dashboard/projects-dashboard/projects-dashboard.component';
import { TasksDashboardComponent } from './components/dashboard/tasks-dashboard/tasks-dashboard.component';
import { MembersDashboardComponent } from './components/dashboard/members-dashboard/members-dashboard.component';
import { FilterSelectComponent } from './components/dashboard/filter-select/filter-select.component';
import { ActivityComponent } from './components/project/activity/activity.component';
import { InitialsPipe } from './pipes/initials.pipe';
import { HighlightNamePipe } from './pipes/highlight-name.pipe';
import { SearchBarComponent } from './shared/components/search-bar/search-bar.component';
import { UserInfoComponent } from './shared/components/user-info/user-info.component';
import { NotificationsComponent } from './shared/components/notifications/notifications.component';
import { ArchivedTaskComponent } from './components/project/archived-task/archived-task.component';
import { TaskModalComponent } from './components/project/task-modal/task-modal.component';

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
    ProjectCardComponent,
    SortableDirective,
    ProjectPageComponent,
    BoardHeaderComponent,
    ColumnComponent,
    TaskCardComponent,
    AddMemberModalComponent,
    AvatarComponent,
    ProjectWizardComponent,
    ProjectCardSkeletonComponent,
    ProjectsPageComponent,
    AppLayoutComponent,
    ProjectsDashboardComponent,
    TasksDashboardComponent,
    MembersDashboardComponent,
    FilterSelectComponent,
    ActivityComponent,
    InitialsPipe,
    HighlightNamePipe,
    SearchBarComponent,
    UserInfoComponent,
    NotificationsComponent,
    ArchivedTaskComponent,
    TaskModalComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    FormsModule,
    OverlayModule,
    PortalModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    NgChartsModule,
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