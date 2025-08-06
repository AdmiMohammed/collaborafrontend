import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.css']
})
export class DashboardPageComponent {
  isSidebarOpen = true;
  
    toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
