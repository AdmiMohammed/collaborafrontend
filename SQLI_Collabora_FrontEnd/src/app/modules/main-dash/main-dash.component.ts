import { Component, OnInit } from '@angular/core';
import { ProjectService, ProjectReadDto } from 'src/app/services/project-service/project.service';

@Component({
  selector: 'app-main-dash',
  templateUrl: './main-dash.component.html',
  styleUrls: ['./main-dash.component.css']
})
export class MainDashComponent {
  projects: ProjectReadDto[] = [];

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.projectService.getAll().subscribe({
      next: (data) => {
        this.projects = data;
      },
      error: (err) => {
        console.error('Erreur de chargement des projets :', err);
      },
    });
  }

  onProjectReorder(updatedProjects: any[]) {
    this.projects = updatedProjects;
    console.log('Projets réorganisés :', this.projects);
  }
}
