import { Component, HostListener } from '@angular/core';

type TabKey = 'projects' | 'tasks' | 'members';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html'
})
export class DashboardPageComponent {
  tab: TabKey = 'members';
  setTab(k: TabKey) { this.tab = k; }

  // Raccourcis clavier 1 / 2 / 3
  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.key === '1') this.setTab('projects');
    if (e.key === '2') this.setTab('tasks');
    if (e.key === '3') this.setTab('members');
  }
}
