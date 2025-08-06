import { Component, OnInit } from '@angular/core';
import { ProjectService, ProjectReadDto } from 'src/app/services/project-service/project.service';

@Component({
  selector: 'app-main-dash',
  templateUrl: './main-dash.component.html',
  styleUrls: ['./main-dash.component.css']
})
export class MainDashComponent {
  projects: ProjectReadDto[] = [];
  isGridView: boolean = true;

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.projectService.getAll().subscribe({
      next: (data) => {
        this.projects = data.sort((a, b) => a.position - b.position);
      },
      error: (err) => {
        console.error('Erreur chargement projets :', err);
      }
    });
  }

  onProjectReorder(updatedProjects: any[]) {
    this.projects = updatedProjects;
    console.log('Projets réorganisés :', this.projects);
  }
}
