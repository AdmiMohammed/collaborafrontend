import { Component, EventEmitter, Input, OnInit, Output, HostListener } from '@angular/core';
import { TaskHistory } from 'src/app/models/task-history';
import { ProjectService } from 'src/app/services/project-service/project.service';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.css']
})
export class ActivityComponent implements OnInit {
  @Input() projectId!: number;
  @Output() closeModal = new EventEmitter<void>();

  history: TaskHistory[] = [];
  isVisible = false; // contrôle l'animation de la modal
  prepared = false;  // indique que les données sont prêtes

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    // Charger les données avant d'afficher la modal
    this.projectService.getProjectHistory(this.projectId).subscribe({
      next: (data) => {
        this.history = data;
        this.prepared = true;     // les données sont prêtes
        setTimeout(() => this.isVisible = true, 10); // animation fade-in
      },
      error: () => {
        this.history = [];
        this.prepared = true;
        setTimeout(() => this.isVisible = true, 10);
      }
    });
  }

  close() {
    this.isVisible = false;
    setTimeout(() => this.closeModal.emit(), 300);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: KeyboardEvent) {
    this.close();
  }
}
