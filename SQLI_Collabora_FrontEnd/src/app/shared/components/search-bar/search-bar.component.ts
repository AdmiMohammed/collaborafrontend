import { Component, ElementRef, HostListener, ViewChild, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectReadDto } from 'src/app/services/project-service/project.service';

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
  dropdownOpen: boolean = false;

  constructor(private router: Router) {}

  onSearchChange() {
    const term = this.searchProject.trim().toLowerCase();
    this.searchResults = term 
      ? this.projects.filter(p => p.name.toLowerCase().includes(term))
      : [...this.projects];  
    this.dropdownOpen = this.searchResults.length > 0;
  }

  onInputFocus() {
    this.searchResults = [...this.projects];
    this.dropdownOpen = this.searchResults.length > 0;
  }

  goToProject(project: ProjectReadDto) {
    this.router.navigate(['/projects', project.id]);
    this.searchProject = '';
    this.searchResults = [];
    this.dropdownOpen = false;
  }

  @HostListener('document:mousedown', ['$event'])
  onClickOutside(event: Event) {
    if (this.dropdownOpen && this.searchContainer && !this.searchContainer.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
      this.searchProject = '';
    }
  }
}
