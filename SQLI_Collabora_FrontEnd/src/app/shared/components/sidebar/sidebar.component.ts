import { Component, Input } from '@angular/core';
import { Router, IsActiveMatchOptions } from '@angular/router';
import { UserService } from 'src/app/services/user-service/user.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  @Input() isOpen: boolean = true;
  imgUrl: string = '../../../assets/images/logo_collabora_icon.svg';
  openWizard = false;

  // IMPORTANT: plus de /dashboard/... ; routes “propres”
  menuItems: Array<{
    label: string;
    link: string;
    iconType: 'img' | 'fa';
    icon: string;
    iconActive?: string;
    exact?: boolean;
  }> = [
    {
      label: 'Dashboard',
      // si tu as mis MainDashComponent sur '', tu peux aussi mettre '/'.
      link: '/home',
      iconType: 'img',
      icon: 'assets/images/home-w.svg',
      iconActive: 'assets/images/home-m.svg',
      exact: true,
    },
    {
      label: 'Projets',
      link: '/projects',
      iconType: 'img',
      icon: 'assets/images/kanban_icon.svg',
      iconActive: 'assets/images/kanban_icon_violet.svg',
      // important: false pour être actif aussi sur /projects/:id
      exact: false,
    },
    // (optionnel) enlève Statistics si pas de route dédiée
    // {
    //   label: 'Statistics',
    //   link: '/stats',
    //   iconType: 'fa',
    //   icon: 'fas fa-chart-line',
    //   exact: false
    // },
    {
      label: 'Profil',
      link: '/profile',
      iconType: 'fa',
      icon: 'fa-regular fa-user',
      exact: true,
    },
    {
      label: 'Paramètres',
      link: '/settings',
      iconType: 'img',
      icon: 'assets/images/icons-settings.svg',
      iconActive: 'assets/images/icons-settings-violet.svg',
      exact: false,
    },
  ];

  constructor(private userService: UserService, public router: Router) {}

  toggleSidebar() {
    this.isOpen = !this.isOpen;
  }

  onLogout(): void {
    this.userService.logout();
  }

  // Active si l’URL “contient” le lien (utile pour /projects et /projects/:id)
  isRouteActive(link: string, exact = false): boolean {
    if (exact) {
      return this.router.isActive(link, {
        paths: 'exact',
        queryParams: 'ignored',
        fragment: 'ignored',
        matrixParams: 'ignored',
      } as IsActiveMatchOptions);
    }
    return this.router.isActive(link, {
      paths: 'subset', // active sur /projects ET /projects/123
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    } as IsActiveMatchOptions);
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
