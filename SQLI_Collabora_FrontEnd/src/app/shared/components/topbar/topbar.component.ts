import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Notification } from 'src/app/models/notification';
import { NotificationService } from 'src/app/services/notification.service';
import { User, UserService } from 'src/app/services/user-service/user.service';

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

      // S'abonner aux notifications (initial + temps réel)
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
        this.unreadCount = notifications.filter(n => !n.isRead).length;
      });

      // Charger les notifications initiales
      this.notificationService.loadInitialNotifications(1, 10);

      // Démarrer la connexion SignalR
      const token = localStorage.getItem('token');
      if (token) {
        this.notificationService.startConnection(token);
      }
    });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  handleNotificationAction(id: number, event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      // Marquer comme lu et supprimer
      this.notificationService.markAsRead(id).subscribe({
        next: () => {
          this.notificationService.deleteNotification(id).subscribe({
            next: () => {
              this.notifications = this.notifications.filter(n => n.id !== id);
              this.unreadCount = this.notifications.filter(n => !n.isRead).length;
            },
            error: (err) => {
              console.error('Erreur lors de la suppression de la notification:', err);
              input.checked = false; // Réinitialiser la checkbox en cas d'erreur
            }
          });
        },
        error: (err) => {
          console.error('Erreur lors du marquage comme lu:', err);
          input.checked = false; // Réinitialiser la checkbox en cas d'erreur
        }
      });
    }
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        // Supprimer toutes les notifications après les avoir marquées comme lues
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

  toggleSidebar() {
    this.toggle.emit();
  }
}