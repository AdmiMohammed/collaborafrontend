import { Router } from '@angular/router';
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Notification } from 'src/app/models/notification';
import { NotificationService } from 'src/app/services/notification.service';
import { UserService } from 'src/app/services/user-service/user.service';
import { User } from 'src/app/models/user';
import { ProjectReadDto, ProjectService } from 'src/app/services/project-service/project.service';
@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css'],
})
export class TopbarComponent implements OnInit, OnDestroy {
  @Input() isSidebarOpen!: boolean;
  @Output() toggle = new EventEmitter<void>();
  @Input() inProject: boolean = false;

  user: User | null = null;
  notifications: Notification[] = [];
  unreadCount: number = 0;
  isOpen: boolean = false;
  private destroy$ = new Subject<void>();
  projects: ProjectReadDto[] = [];
  constructor(
    private userService: UserService,
    private router: Router,
    private notificationService: NotificationService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    // Abonnement au user
    this.userService.currentUser$
    .pipe(takeUntil(this.destroy$))
    .subscribe(user => {
      this.user = user;
    });

    // Abonnement aux notifications
    this.notificationService.notifications$
    .pipe(takeUntil(this.destroy$))
    .subscribe(notifications => {
      this.notifications = notifications;
      this.unreadCount = notifications.filter(n => !n.isRead).length;
    });

    // Charger user si pas déjà en mémoire
    if (!this.userService.getCurrentUserValue()) {
      this.userService.fetchCurrentUser().subscribe();
    }

    // Charger notifications initiales
    this.notificationService.loadInitialNotifications(1, 10);

    // Démarrer SignalR
    const token = localStorage.getItem('token');
    if (token) {
      this.notificationService.startConnection(token);
    }
    // 🔹 Charger les projets une seule fois ici
    this.projectService.getAll().subscribe(projects => this.projects = projects);
    console.log('Projets chargés:', this.projects);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar() {
    this.toggle.emit();
  }

  goToDashboard() {
    return this.router.navigate(['/dashboard'])
  }

  get initials(): string {
    if (!this.user) return '';
    const fullName = `${this.user.firstName} ${this.user.lastName}`.trim();
    return fullName.split(' ').map(w => w[0]?.toUpperCase()).join('');
  }

  markAllNotificationsAsRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(notif => {
        this.notificationService.deleteNotification(notif.id).subscribe();
      });
      this.notifications = [];
      this.unreadCount = 0;
    });
  } 

  handleNotificationAction(id: number, event: Event) {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.notificationService.markAsRead(id).subscribe(() => {
        this.notificationService.deleteNotification(id).subscribe(() => {
          this.notifications = this.notifications.filter(n => n.id !== id);
          this.unreadCount = this.notifications.filter(n => !n.isRead).length;
        });
      });
    }
  }
}
