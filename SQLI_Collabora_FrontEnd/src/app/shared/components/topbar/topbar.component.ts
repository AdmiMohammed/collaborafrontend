import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
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

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    if (!this.userService.getCurrentUserValue()) {
      this.userService.fetchCurrentUser().subscribe();
    }

    this.userService.currentUser$.subscribe((data: User | null) => {
      this.user = data;
    });
  }

  toggleSidebar() {
    this.toggle.emit();
  }
}

