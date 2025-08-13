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
    this.userService.fetchCurrentUser().subscribe(user => {
      this.user = user;

      // 1. S'abonner aux notifications (initial + temps réel)
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
        this.unreadCount = notifications.filter(n => !n.isRead).length;
      });

      // 2. Charger les notifications initiales
      this.notificationService.loadInitialNotifications(1, 10);

      // 3. Démarrer la connexion SignalR
      const token = localStorage.getItem('token');
      if (token) {
        this.notificationService.startConnection(token);
      }
    });
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
}
