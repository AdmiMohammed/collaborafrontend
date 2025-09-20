import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { Notification } from 'src/app/models/notification';
import { MenuStateService } from 'src/app/services/menu-state-service/menu-state.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: [],
  animations: [
      trigger('dropdownAnimation', [
        state('void', style({ opacity: 0, transform: 'translateY(-10px)' })),
        state('*', style({ opacity: 1, transform: 'translateY(0)' })),
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
export class NotificationsComponent {
  @Input() notifications: Notification[] = [];
  @Input() unreadCount = 0;
  menuId = 'notifications';

  @Output() markAllAsRead = new EventEmitter<void>();
  @Output() handleAction = new EventEmitter<{ id: number; event: Event }>();

  constructor(private elRef: ElementRef, private menuState: MenuStateService) {}

  get isOpen(): boolean {
    return this.menuState.isOpen(this.menuId);
  }

  onToggle(event: Event) {
    event.stopPropagation();
    if (this.menuState.isOpen(this.menuId)) {
      this.menuState.close(this.menuId);
    } else {
      this.menuState.open(this.menuId);
    }
  }


  @HostListener('document:mousedown', ['$event'])
  onClickOutside(event: Event) {
    if (this.isOpen && !this.elRef.nativeElement.contains(event.target)) {
      this.menuState.close(this.menuId)
    }
  }

  getNotificationIcon(type: { value: string } | string): string {
    const typeValue = typeof type === 'string' ? type : type.value;
    const normalizedType = typeValue.charAt(0).toUpperCase() + typeValue.slice(1).toLowerCase();
    const icons: { [key: string]: string } = {
      'Comment': 'fa-regular fa-comment-dots',
      'Assignment': 'fa-solid fa-user-plus',
      'Unassignment': 'fa-solid fa-user-minus'
    };
    return icons[normalizedType] || 'fa-regular fa-bell';
  }

  onMarkAllAsRead() {
    this.markAllAsRead.emit();
  }

  onHandleAction(id: number, event: Event) {
    this.handleAction.emit({ id, event });
  }
}
