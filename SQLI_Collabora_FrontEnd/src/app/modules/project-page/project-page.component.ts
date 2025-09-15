import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Board, Label, Project } from 'src/app/models/project';
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

  constructor(private projectService: ProjectService,
    private route: ActivatedRoute
  ) { }

  @ViewChild('newColumnInput') newColumnInput!: ElementRef<HTMLInputElement>;

  cancelAddColumn() {
    this.addingColumn = false;
    this.newColumnName = '';
  }

  openAddColumn() {
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


  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const projectId = idParam ? +idParam : null; // The unary plus converts string to number
    if (projectId != null) {
      this.projectService.getProjectDetails(projectId).subscribe({
        next: (data) => {
          this.project = data;
          //sorted columns
          if (this.project?.columns) {
            this.project.columns.sort((a, b) => a.position - b.position);
          }
        },
        error: (err) => {
          console.error('Erreur chargement projets :', err);
          //later
        }
      });
    }
    else {
      //left error handling for later
    }
  }

  //column menu

  toggleMenu(columnId: number) {
    if (this.openMenuColumnId === columnId) {
      this.openMenuColumnId = null; // close if clicking same column again
    } else {
      this.openMenuColumnId = columnId; // open this column, close others
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    this.openMenuColumnId = null;
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
