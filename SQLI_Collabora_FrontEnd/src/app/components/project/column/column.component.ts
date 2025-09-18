import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Board, Label, Task } from 'src/app/models/project';
import { ProjectMemberDto, ProjectService } from 'src/app/services/project-service/project.service';

@Component({
  selector: 'app-column',
  templateUrl: './column.component.html',
  styleUrls: []
})
export class ColumnComponent {
  @Input() projectLabels!: Label[];
  @Input() column!: Board;
  @Input() members!: ProjectMemberDto[];
  @Input() menuOpen: boolean = false;
  @Input() activeColumnId!: number | null;

  @Output() toggleMenu = new EventEmitter<number>();
  @Output() requestAddTask = new EventEmitter<number | null>();
  newTaskName = '';
  menuLeft = 0; // pixels offset from left of viewport
  editingName = false;
  editedName = '';
  @Output() columnArchived = new EventEmitter<number>();

  constructor(private projectService: ProjectService) { }

  @ViewChild('taskInput') taskInput!: ElementRef;
  @ViewChild('addTaskContainer') addTaskContainer!: ElementRef;
  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;
  
  get addingTask(): boolean {
    return this.activeColumnId === this.column.id;
  }
  startAddingTask(fromHeader: boolean) {
    this.requestAddTask.emit(this.column.id);
    // Wait for DOM render then focus
    setTimeout(() => {
      this.taskInput?.nativeElement.focus();
      if (fromHeader) {
        this.addTaskContainer.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
  

  async confirmAddTask() {
    if (this.newTaskName.trim()) {
      // Calculate next position
      const nextPosition = this.column.tasks.length > 0
        ? Math.max(...this.column.tasks.map(t => t.position ?? 0)) + 1
        : 0;

      const newTask = await firstValueFrom(
        this.projectService.createTask({
          title: this.newTaskName,
          boardId: this.column.id,
          position: nextPosition
        })
      )
      this.column.tasks.push(newTask);
    }
    this.newTaskName = '';
    this.requestAddTask.emit(null); 
  }

  cancelAddTask() {
    this.newTaskName = '';
    this.requestAddTask.emit(null);
  }

  onToggleMenu(event: MouseEvent, columnId: number) {
    if (!this.menuOpen) {
      event.stopPropagation(); // Prevents click from bubbling up

      const button = event.currentTarget as HTMLElement;
      const parent = button.parentElement!; // The .relative container
      const parentRect = parent.getBoundingClientRect(); // Position of parent in viewport
      const buttonRect = button.getBoundingClientRect(); // Position of button in viewport
      const screenWidth = window.innerWidth;

      const dropdownWidth = 224; // Tailwind w-56 = 14rem = 224px

      // Initial left offset: how far the button's right edge overflows the parent
      let overflowRight = buttonRect.right - parentRect.right;

      // If dropdown would overflow the screen, shift it left
      if (buttonRect.right + dropdownWidth > screenWidth) {
        overflowRight -= (buttonRect.right + dropdownWidth - screenWidth + 16); // 16px padding
        if (overflowRight > 0) overflowRight = 0; // Clamp to 0 so it doesn't float too far left
      }


      this.menuLeft = overflowRight; // Final left offset inside parent
    }
    this.toggleMenu.emit(columnId); // notify parent to toggle open/close
  }

  // Optional: close on outside click
  ngOnInit() {
    document.addEventListener('click', () => {
      this.menuOpen = false;
    });
  }

  //editing name of the list
  startEditingName() {
    this.editedName = this.column.name;
    this.editingName = true;
  }

  async finishEditingName() {
    if (this.editedName.trim().length > 0) {
      const updatedColumn = await firstValueFrom(
        this.projectService.updateColumnName(
          this.editedName.trim(),
          this.column.id
        )
      )
      const trimmed = this.editedName.trim();
      if (trimmed.length > 60) {
        this.editedName = trimmed.slice(0, 60);
      }
      this.column.name = this.editedName.trim();
    }
    this.editingName = false;
  }

  ngAfterViewChecked() {
    if (this.editingName && this.nameInput) {
      this.nameInput.nativeElement.focus();
    }
  }


 async archiveColumn() {
  try {
    await firstValueFrom(this.projectService.archiveBoard(this.column.id));
    this.columnArchived.emit(this.column.id); 
  } catch (error) {
    console.error('Erreur lors de l’archivage :', error);
  }
}

  onTasksReordered(event: {
    movedItem: Task,
    oldIndex: number,
    newIndex: number,
    fromColumn: Board,
    toColumn: Board
  }) {
    const { movedItem, newIndex, fromColumn, toColumn } = event;

    // Persist change to backend
    this.projectService.reorderTask(movedItem.id, {
      newBoardId: toColumn.id,
      newPosition: newIndex
    }).subscribe();

    // Remove from source column
    fromColumn.tasks = fromColumn.tasks.filter(t => t.id !== movedItem.id);

    // Insert into target column at new position
    toColumn.tasks.splice(newIndex, 0, movedItem);

    // Optional: recalc positions
    toColumn.tasks.forEach((t, i) => t.position = i);
    fromColumn.tasks.forEach((t, i) => t.position = i);
  }


  trackTaskById(index: number, task: any) {
    return task.id; // or task whatever unique identifier you have
  }


  get sortedTasks() {
    return this.column.tasks.slice().sort((a, b) => a.position - b.position);
  }


  @Output() labelsChanged = new EventEmitter<Label[]>();

  onLabelsChanged(updated: Label[]) {
    this.labelsChanged.emit(updated);
  }
}