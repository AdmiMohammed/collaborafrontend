import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';

import { Notification } from 'src/app/models/notification';
import { User } from 'src/app/models/user';

import { NotificationService } from 'src/app/services/notification.service';

import { UserService } from 'src/app/services/user-service/user.service';


@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit {
  @Input() isSidebarOpen!: boolean;
  @Output() toggle = new EventEmitter<void>();

  user: User | null = null;
  notifications: Notification[] = [];
  unreadCount: number = 0;
  isOpen: boolean = false;

  constructor(private userService: UserService, private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.userService.currentUser$.subscribe(user => {
      this.user = user;
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


  loadNotifications() {
    this.notificationService.getUserNotifications(1, 10).subscribe(data => {
      this.notifications = data;
    });
  }

  loadStats() {
    this.notificationService.getStats().subscribe(stats => {
      this.unreadCount = stats.unreadCount;
    });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  markAsRead(id: number) {
    this.notificationService.markAsRead(id).subscribe(() => {
      this.notifications = this.notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      );
      this.unreadCount--;
    });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
      this.unreadCount = 0;
    });
  }

  deleteNotification(id: number) {
    this.notificationService.deleteNotification(id).subscribe(() => {
      this.notifications = this.notifications.filter(n => n.id !== id);
    });
  }

  toggleSidebar() {
    this.toggle.emit();
  }

  get initials(): string {
  if (!this.user) return '';
  const fullName = `${this.user.firstName} ${this.user.lastName}`.trim();
  return fullName
    .split(' ')
    .map(w => w[0]?.toUpperCase())
    .join('');
}

}