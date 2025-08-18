import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { UserService } from 'src/app/services/user-service/user.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
      animations: [
      trigger('wizardAnimation', [
        transition(':enter', [
          style({ opacity: 0, transform: 'scale(0.95)' }),
          animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
        ]),
        transition(':leave', [
          animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
        ]),
      ]),
    ]
})
export class SidebarComponent {
  @Input() isOpen: boolean = true;
  imgUrl: string = "../../../assets/images/logo_collabora_icon.svg"
  openWizard = false;
menuItems = [
  {
    label: 'Dashboard',
    link: '/dashboard',
    iconType: 'img',
    icon: 'assets/images/home-w.svg',
    iconActive: 'assets/images/home-m.svg'
  },
  {
    label: 'Projects',
    link: '/projects',
    iconType: 'img',
    icon: 'assets/images/kanban_icon.svg',
    iconActive: 'assets/images/kanban_icon.svg'
  },
  {
    label: 'Statistics',
    link: '/dashboard/statistics',
    iconType: 'fa',
    icon: 'fas fa-chart-line'
  },
  {
    label: 'Profile',
    link: '/dashboard/profile',
    iconType: 'fa',
    icon: 'fa-regular fa-user'
  },
  {
    label: 'Settings',
    link: '/settings',
    iconType: 'img',
    icon: 'assets/images/icons-settings.svg',
    iconActive: 'assets/images/icons-settings-violet.svg'
  }
];

  toggleSidebar() {
    this.isOpen = !this.isOpen;
  }

  constructor(private userService: UserService, public router: Router,){}

  onLogout(): void {
    this.userService.logout();
  }
  
  isRouteActive(route: string): boolean {
    return this.router.url === route;
  }

    openNewProjectWizard() {
    this.openWizard = true;
    document.body.style.overflow = 'hidden';
  }

  handleWizardClose() {
    this.openWizard = false;
    document.body.style.overflow = '';
  }
  
}
