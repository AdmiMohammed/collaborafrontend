import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserService } from 'src/app/services/user-service/user.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent {
  @Input() isSidebarOpen!: boolean;
  @Output() toggle = new EventEmitter<void>();
  user: any;
  constructor(private userService : UserService){}

   ngOnInit(): void {
    this.userService.getCurrentUser().subscribe({
      next: (data) => {
        this.user = data;
        console.log(data);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de l’utilisateur connecté', err);
      }
    });
  }
  toggleSidebar() {
    this.toggle.emit();
  }
}
