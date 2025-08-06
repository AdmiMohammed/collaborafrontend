import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() isOpen: boolean = true;
  imgUrl: string = "../../../assets/images/logo_collabora_icon.svg"
  
  toggleSidebar() {
    this.isOpen = !this.isOpen;
  }

  constructor(private authService: AuthService, public router: Router){}

  onLogout(): void {
    this.authService.logout();
  }

  
}
