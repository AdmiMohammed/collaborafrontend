import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Board, Task } from 'src/app/models/project';
import { ProjectService } from 'src/app/services/project-service/project.service';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-archived-task',
  templateUrl: './archived-task.component.html',
  styleUrls: [],
  animations: [
      trigger('overlayAnimation', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition('void <=> *', animate('200ms ease-in-out'))
    ]),
    trigger('modalAnimation', [
      state('void', style({ opacity: 0, transform: 'scale(0.95)' })),
      state('*', style({ opacity: 1, transform: 'scale(1)' })),
      transition('void <=> *', animate('200ms ease-in-out')),
    ])
      ]
})
export class ArchivedTaskComponent implements OnInit{
  @Input() projectId!: number;
  archivedTasks: Task[] = [];
  loading = false;
  archivedColumns: Board[] = [];
  showTasks = true; 
  @Output() closeModal = new EventEmitter<void>();
  @Output() taskRestored = new EventEmitter<Task>();
  @Output() columnRestored = new EventEmitter<number>();
  constructor(private projectService: ProjectService) {}

  ngOnInit() {
  this.loadArchivedColumns();
  this.loadArchivedTasks(); 
}
  toggleView(view: 'tasks' | 'columns') {
    this.showTasks = view === 'tasks';
  }
loadArchivedTasks() {
  this.loading = true;
  this.projectService.getArchivedTasksForProject(this.projectId).subscribe({
    next: (tasks) => {
      this.archivedTasks = tasks;
      this.loading = false;
    },
    error: () => this.loading = false
  });
}
  close() {
    this.closeModal.emit();
  }
 restoreTask(task: Task) {
  this.projectService.restoreTask(task.id).subscribe({
    next: () => {
      this.archivedTasks = this.archivedTasks.filter(t => t.id !== task.id);
      this.taskRestored.emit(task); 
    },
    error: (err) => console.error('Erreur restauration tâche', err)
  });
}

  deleteTask(task: Task) {
    if (!confirm('Voulez-vous vraiment supprimer cette tâche ?')) return;

    this.projectService.deleteTask(task.id).subscribe({
      next: () => {
        this.archivedTasks = this.archivedTasks.filter(t => t.id !== task.id);
      },
      error: (err) => console.error('Erreur suppression tâche', err)
    });
  }
  loadArchivedColumns() {
    this.projectService.getArchivedColumns(this.projectId).subscribe({
      next: (columns) => this.archivedColumns = columns,
      error: (err) => console.error(err)
    });
  }
 restoreColumn(columnId: number) {
  this.projectService.restoreBoard(columnId).subscribe({
    next: () => {
      this.archivedColumns = this.archivedColumns.filter(c => c.id !== columnId);
      this.columnRestored.emit(columnId); 
    },
    error: (err) => console.error(err)
  });
}

  deleteColumn(columnId: number) {
    if (!confirm('Voulez-vous vraiment supprimer cette colonne ?')) return;
    this.projectService.deleteColumn(columnId).subscribe({
      next: () => this.archivedColumns = this.archivedColumns.filter(c => c.id !== columnId),
      error: (err) => console.error(err)
    });
  }
}
