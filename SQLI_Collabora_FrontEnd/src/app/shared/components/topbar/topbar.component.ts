import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/services/user-service/user.service';
import { UserService } from 'src/app/services/user-service/user.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit {
  @Input() isSidebarOpen!: boolean;
  @Output() toggle = new EventEmitter<void>();
  router: Router;
  @Input() inProject: boolean = false;

  user: User | null = null;

  constructor(private userService: UserService, router: Router) {
    this.router = router;
  }

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
  
  goToDashboard(){
    return this.router.navigate(['/dashboard'])
  }
}

