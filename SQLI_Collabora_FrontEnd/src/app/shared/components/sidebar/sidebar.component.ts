import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  isOpen: boolean = true;
  imgUrl: string = "../../../assets/images/colla-icon.png"
  
  toggleSidebar() {
    this.isOpen = !this.isOpen;
  }

  constructor(private authService: AuthService){}

  onLogout(): void {
    this.authService.logout();
  }
}
