import { Router } from '@angular/router';
import { AppUser } from 'src/app/services/user-service/user1.service';
import { Component, EventEmitter, Input, Output, OnInit, HostListener } from '@angular/core';
import { Notification } from 'src/app/models/notification';
import { User } from 'src/app/models/user';
import { NotificationService } from 'src/app/services/notification.service';
import { UserService } from 'src/app/services/user-service/user.service';
import { trigger, transition, style, animate, state } from '@angular/animations';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css'],
  animations: [
    trigger('dropdownAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(-10px)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('void => *', animate('200ms ease-out')),
      transition('* => void', animate('150ms ease-in'))
    ]),
    trigger('notificationItem', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateX(20px)' }))
      ])
    ])
  ]
})
export class TopbarComponent implements OnInit {
  @Input() isSidebarOpen!: boolean;
  @Output() toggle = new EventEmitter<void>();
  router: Router;
  @Input() inProject: boolean = false;

  user: AppUser | null = null;
  notifications: Notification[] = [];
  unreadCount: number = 0;
  isOpen: boolean = false;

  constructor(private userService: UserService, router: Router, private notificationService: NotificationService) {
    this.router = router;
  }

  ngOnInit(): void {
    this.userService.currentUser$.subscribe(user => {
      this.user = user;
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
        this.unreadCount = notifications.filter(n => !n.isRead).length;
      });
      this.notificationService.loadInitialNotifications(1, 10);
      const token = localStorage.getItem('token');
      if (token) {
        this.notificationService.startConnection(token);
      }
    });

    if (!this.userService.getCurrentUserValue()) {
      this.userService.fetchCurrentUser().subscribe();
    }

    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
      this.unreadCount = notifications.filter(n => !n.isRead).length;
    });

    this.notificationService.loadInitialNotifications(1, 10);

    const token = localStorage.getItem('token');
    if (token) {
      this.notificationService.startConnection(token);
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-dropdown') && !target.closest('button[aria-label="Notifications"]')) {
      this.isOpen = false;
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  getNotificationIcon(type: { value: string } | string): string {
    const typeValue = typeof type === 'string' ? type : type.value;
    const normalizedType = typeValue.charAt(0).toUpperCase() + typeValue.slice(1).toLowerCase();
    console.log('Type de notification reçu:', typeValue, 'Normalisé:', normalizedType); // Pour débogage
    const icons: { [key: string]: string } = {
      'Comment': 'fa-regular fa-comment-dots',
      'Assignment': 'fa-solid fa-user-plus',
      'Unassignment': 'fa-solid fa-user-minus'
    };
    return icons[normalizedType] || 'fa-regular fa-bell';
  }
  handleNotificationAction(id: number, event: Event) {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.notificationService.markAsRead(id).subscribe({
        next: () => {
          this.notificationService.deleteNotification(id).subscribe({
            next: () => {
              this.notifications = this.notifications.filter(n => n.id !== id);
              this.unreadCount = this.notifications.filter(n => !n.isRead).length;
            },
            error: (err) => {
              console.error('Erreur lors de la suppression de la notification:', err);
              input.checked = false;
            }
          });
        },
        error: (err) => {
          console.error('Erreur lors du marquage comme lu:', err);
          input.checked = false;
        }
      });
    }
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(notif => {
          this.notificationService.deleteNotification(notif.id).subscribe({
            error: (err) => console.error(`Erreur lors de la suppression de la notification ${notif.id}:`, err)
          });
        });
        this.notifications = [];
        this.unreadCount = 0;
      },
      error: (err) => console.error('Erreur lors du marquage de toutes les notifications comme lues:', err)
    });
  }

  get initials(): string {
    if (!this.user) return '';
    const fullName = `${this.user.firstName} ${this.user.lastName}`.trim();
    return fullName
      .split(' ')
      .map(w => w[0]?.toUpperCase())
      .join('');
  }
  toggleSidebar() {
    this.toggle.emit();
  }

  goToDashboard() {
    return this.router.navigate(['/dashboard'])
  }
}

