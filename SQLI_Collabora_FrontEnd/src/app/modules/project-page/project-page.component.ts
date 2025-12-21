import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Project, Task, Board, Label, } from 'src/app/models/project';
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



  // async ngOnInit() {
  //   const projectId = this.route.snapshot.paramMap.get('id');
  //   if (projectId) {
  //     this.project = await firstValueFrom(this.projectService.getProjectDetails(Number(projectId)));

  //     // ✅ filtrer les tasks archivées au chargement
  //     this.project.columns.forEach(col => {
  //       col.tasks = col.tasks.filter(task => !task.isArchived);
  //     });
  //   }
  // }
  async ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const projectId = params.get('id');
      if (projectId) {
        this.project = await firstValueFrom(
          this.projectService.getProjectDetails(Number(projectId))
        );

        // ✅ filtrer les tasks archivées au chargement
        this.project.columns.forEach(col => {
          col.tasks = col.tasks.filter(task => !task.isArchived);
        });

        // ✅ trier les colonnes par position
        if (this.project?.columns) {
          this.project.columns.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        }
      }
    })
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
  columnMap: Map<HTMLElement, Board> = new Map();
  @ViewChildren('columnList', { read: ElementRef }) columnEls!: QueryList<ElementRef>;

  ngAfterViewInit() {
    this.columnMap = new Map<HTMLElement, Board>();
    this.columnEls.forEach((elRef, index) => {
      this.columnMap.set(elRef.nativeElement, this.project.columns[index]);
    });
  }

  get sortedColumns() {
    return this.project.columns.slice().sort((a, b) => a.position - b.position);
  }

  onColumnsReorder(event: {
    movedItem: any,
    oldIndex: number,
    newIndex: number,
    fromColumn: any | null,
    toColumn: any | null,
    items?: any[]
  }) {
    const movedItem = event.movedItem;
    const newIndex = event.newIndex;

    // Call backend reorder
    this.projectService
      .reorderColumn(this.project.id, movedItem.id, newIndex)
      .subscribe({
        next: () => {
          // ✅ update local state (optional since directive already reordered items)
          this.project.columns = event.items ?? this.project.columns;
        },
        error: (err) => {
          console.error('Reorder failed', err);
          // ❌ rollback UI if needed
          this.project.columns = [...this.sortedColumns];
        }
      });
  }

  onLabelsChanged(updated: Label[]) {
    // 1️⃣ Update the project labels
    this.project.labels = updated;

    // 2️⃣ Create a Set of existing label IDs for quick lookup
    const existingLabelIds = new Set(updated.map(l => l.id));

    // 3️⃣ Loop through all columns and all tasks
    this.project.columns.forEach(column => {
      column.tasks.forEach(task => {
        // 4️⃣ Remove taskLabels that no longer exist in project
        task.taskLabels = task.taskLabels!.filter(taskLabel =>
          existingLabelIds.has(taskLabel.label.id)
        );

        // 5️⃣ Optionally, sync updated label info (name/color) in tasks
        task.taskLabels.forEach(taskLabel => {
          const projectLabel = updated.find(l => l.id === taskLabel.label.id);
          if (projectLabel) {
            taskLabel.label.name = projectLabel.name;
            taskLabel.label.color = projectLabel.color;
          }
        });
      });
    });
  }


}
