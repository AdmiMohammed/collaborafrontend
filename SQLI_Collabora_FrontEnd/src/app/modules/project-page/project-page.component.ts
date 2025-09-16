import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Project, Task } from 'src/app/models/project';
import { ProjectService } from 'src/app/services/project-service/project.service';

@Component({
  selector: 'app-project-page',
  templateUrl: './project-page.component.html',
  styleUrls: ['./project-page.component.css']
})
export class ProjectPageComponent implements OnInit {
  project!: Project;
  addingColumn = false;
  newColumnName = '';
  openMenuColumnId: number | null = null;
  activeAddTaskColumnId: number | null = null;

  constructor(private projectService: ProjectService,
    private route: ActivatedRoute
  ) { }

  @ViewChild('newColumnInput') newColumnInput!: ElementRef<HTMLInputElement>;

  cancelAddColumn() {
    this.addingColumn = false;
    this.newColumnName = '';
  }

  openAddColumn() {
     // On Ferme tous les inputs d'ajout de carte ouverts
  this.activeAddTaskColumnId = null;
    this.addingColumn = true;
    this.newColumnName = '';

    // Focus input after view updates
    setTimeout(() => {
      this.newColumnInput?.nativeElement.focus();
    });
  }

  async addColumn() {
    if (!this.newColumnName.trim()) return;

    try {
      // Calculate next position
      const nextPosition = this.project.columns.length > 0
        ? Math.max(...this.project.columns.map(c => c.position ?? 0)) + 1
        : 0;

      const newColumn = await firstValueFrom(
        this.projectService.createColumn({
          name: this.newColumnName,
          projectId: this.project.id,
          position: nextPosition,
        })
      );
      this.project.columns.push(newColumn!);
      this.cancelAddColumn();
    } catch (error) {
      console.error('Failed to add column', error);
      // left error handling for later
    }
  }


  
  async ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.project = await firstValueFrom(this.projectService.getProjectDetails(Number(projectId)));

      // ✅ filtrer les tasks archivées au chargement
      this.project.columns.forEach(col => {
        col.tasks = col.tasks.filter(task => !task.isArchived);
      });
    }
  }

  //column menu
  toggleMenu(columnId: number) {
    console.log(columnId)
    if (this.openMenuColumnId === columnId) {
      this.openMenuColumnId = null; // close if clicking same column again
    } else {
      this.openMenuColumnId = columnId; // open this column, close others
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    console.log(event)
    const target = event.target as HTMLElement;
    this.openMenuColumnId = null;
  }

  setActiveColumn(columnId: number | null) {
    this.activeAddTaskColumnId = columnId;
    // On ferme l'input d'ajout de colonne si on commence à ajouter une carte
    if (columnId !== null) {
      this.addingColumn = false;
    }
  }
onColumnArchived(columnId: number) {
  const col = this.project.columns.find(c => c.id === columnId);
  if (col) col.isArchived = true; // Angular masque grâce au *ngIf
}

restoreColumn(columnId: number) {
  this.projectService.restoreBoard(columnId).subscribe({
    next: () => {
      const col = this.project.columns.find(c => c.id === columnId);
      if (col) col.isArchived = false;
    },
    error: (err) => console.error(err)
  });
}
onTaskRestored(task: Task) {
  const column = this.project.columns.find(c => c.id === task.boardId);
  if (column) {
    // Supprimer l’ancienne version de la tâche (archivée)
    task.isArchived = false;
    column.tasks = column.tasks.filter(t => t.id !== task.id);

    // Ajouter la tâche restaurée
    column.tasks.push(task);


    // column.tasks.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }
}
onColumnRestored(columnId: number) {
  const column = this.project.columns.find(c => c.id === columnId);
  if (column) {
    column.isArchived = false;
  }

}
}
