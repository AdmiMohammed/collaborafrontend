import { Component, ElementRef, HostListener, ViewChild, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectReadDto } from 'src/app/models/project';
import { MenuStateService } from 'src/app/services/menu-state-service/menu-state.service';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: []
})
export class SearchBarComponent {
  @ViewChild('searchContainer') searchContainer!: ElementRef;
  @Input() projects: ProjectReadDto[] = [];

  placeholder: string = 'Rechercher';
  searchProject: string = '';
  searchResults: ProjectReadDto[] = [];
  menuId: string = 'searchBar';

  constructor(private router: Router, private menuState: MenuStateService) { }

  get isOpen(): boolean {
    return this.menuState.isOpen(this.menuId);
  }

  onSearchChange() {
    const term = this.searchProject.trim().toLowerCase();
    this.searchResults = term
      ? this.projects.filter(p => p.name.toLowerCase().includes(term))
      : [...this.projects];
    if (this.searchResults.length === 0) {
      this.menuState.close(this.menuId);
    }
  }

  onInputFocus() {
    this.searchResults = [...this.projects];
    if (this.searchResults.length > 0) {
      this.menuState.open(this.menuId);
    }
  }

  goToProject(project: ProjectReadDto) {
    this.router.navigate(['/projects', project.id]);
    this.searchProject = '';
    this.searchResults = [];
    this.menuState.close(this.menuId)
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.isOpen && this.searchContainer && !this.searchContainer.nativeElement.contains(event.target)) {
      this.menuState.close(this.menuId)
      this.searchProject = '';
    }
  }
}
