import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Board, Label, Task } from 'src/app/models/project';
import { ProjectMemberDto, ProjectService } from 'src/app/services/project-service/project.service';

@Component({
  selector: 'app-column',
  templateUrl: './column.component.html',
  styleUrls: ['./column.component.css']
})
export class ColumnComponent {
  @Input() projectLabels!: Label[];
  @Input() column!: Board;
  @Input() members!: ProjectMemberDto[];
  @Input() menuOpen: boolean = false;
  @Output() toggleMenu = new EventEmitter<number>();

  constructor(private projectService: ProjectService) { }

  addingTask = false;
  newTaskName = '';

  menuLeft = 0; // pixels offset from left of viewport

  editingName = false;
  editedName = '';

  @ViewChild('taskInput') taskInput!: ElementRef;
  @ViewChild('addTaskContainer') addTaskContainer!: ElementRef;
  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;

  startAddingTask(fromHeader: boolean) {
    this.addingTask = true;

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
    this.addingTask = false;
  }

  cancelAddTask() {
    this.newTaskName = '';
    this.addingTask = false;
  }

  onToggleMenu(event: MouseEvent, columnId: number) {
    console.log(this.menuOpen)
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
    // this.menuOpen = !this.menuOpen; // Toggle menu visibility
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


// onTasksReordered(column: Board, event: { items: any[], oldIndex: number, newIndex: number }) {
//   const movedTask = event.items[event.newIndex];

//   // Determine if the task changed column
//   const newBoardId = column.id;

//   console.log(newBoardId)
//   console.log(movedTask.id)
//   console.log(event.newIndex)

//   this.projectService.reorderTask(movedTask.id, {
//     newBoardId,
//     newPosition: event.newIndex
//   }).subscribe({
//     next: () => console.log('Task moved successfully'),
//     error: (err) => console.error('Failed to move task', err)
//   });

//   // update local column.tasks array
//   column.tasks = event.items;
// }

// onTasksReordered(event: { items: any[], oldIndex: number, newIndex: number, targetColumn: any }) {
//     const movedTask = event.items[event.newIndex];
//   // const movedTask = event.movedItem;
//   const newBoardId = event.targetColumn.id;

//   console.log(newBoardId)
//   console.log(movedTask.id)
//   console.log(event.newIndex)

//   this.projectService.reorderTask(movedTask.id, {
//     newBoardId,
//     newPosition: event.newIndex
//   }).subscribe();

//   // Update the tasks array in the target column
//   event.targetColumn.tasks = event.items;
// }

onTasksReordered(event: {
  movedItem: Task,
  oldIndex: number,
  newIndex: number,
  fromColumn: Board,
  toColumn: Board
}) {
  const { movedItem, newIndex, fromColumn, toColumn } = event;

  console.log(movedItem.title)
  console.log(fromColumn)
  console.log(toColumn.id)
  console.log(newIndex)

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

// onTasksReordered(event: { items: any[], oldIndex: number, newIndex: number, fromColumn: any, toColumn: any }) {
//   const movedTask = event.items[event.oldIndex];
//   const newBoardId = event.toColumn.id;

//   // console.log(newBoardId)
//   // console.log(movedTask)
//   // console.log(event.newIndex)

//   this.projectService.reorderTask(movedTask.id, {
//     newBoardId,
//     newPosition: event.newIndex
//   }).subscribe();

//   // Update both source and target column arrays
//   event.fromColumn.tasks.splice(event.oldIndex, 1);
//   event.toColumn.tasks.splice(event.newIndex, 0, movedTask);
// }



//   isEditModalOpen = false;
//   selectedTask!: Task | null;

// openTaskEditModal(task: Task) {
//   this.selectedTask = task;
//   this.isEditModalOpen = true;
// }

// closeTaskEditModal() {
//   this.isEditModalOpen = false;
//   this.selectedTask = null;
// }


//  selectedTask: Task | null = null;
//   isModalOpen = false;

//   openTaskModal(task: Task): void {
//     this.selectedTask = { ...task }; // Create a copy to avoid direct mutation
//     this.isModalOpen = true;
//   }

//   closeModal(): void {
//     this.isModalOpen = false;
//     this.selectedTask = null;
//   }

//   saveTask(updatedTask: Task): void {
//     // Find the task in the column and update it
//     const index = this.column.tasks.findIndex(t => t.id === updatedTask.id);
//     if (index !== -1) {
//       this.column.tasks[index] = updatedTask;
//     }
//     this.closeModal();
//   }

//   moveTask(): void {
//     // Implement task moving logic between columns
//     console.log('Move task functionality');
//   }

//   archiveTask(): void {
//     if (this.selectedTask) {
//       // Remove task from the column
//       this.column.tasks = this.column.tasks.filter(t => t.id !== this.selectedTask!.id);
//       this.closeModal();
//     }
//   }

  // getMemberById(userId: number): ProjectMemberDto | undefined {
  //   return this.projectMembers.find(member => member.userId === userId);
  // }

  @Output() labelsChanged = new EventEmitter<Label[]>();

onLabelsChanged(updated: Label[]) {
  this.labelsChanged.emit(updated);
}
}
