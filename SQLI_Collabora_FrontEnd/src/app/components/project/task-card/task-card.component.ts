import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Board, Label, Task } from 'src/app/models/project';
import { ProjectMemberDto, ProjectService } from 'src/app/services/project-service/project.service';

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.css']
})
export class TaskCardComponent {
  @Input() projectLabels!: Label[];
  @Input() columnName!: string;
  @Input() task!: Task;
  @Input() members: ProjectMemberDto[] = [];

  constructor(private projectService: ProjectService) { }

  isEditing = false;
  taskTitleDraft = '';

  @ViewChild('titleInput') titleInput!: ElementRef<HTMLTextAreaElement>;

  // --- Helper functions ---
  getMemberById(id: number): ProjectMemberDto | undefined {
    return this.members.find(m => m.userId === id);
  }

  isDeadlineClose(deadline: string | Date): boolean {
    if (!deadline) return false;

    const now = new Date();
    const deadlineDate = new Date(deadline);

    // Consider "close" if deadline is today or overdue
    return deadlineDate <= now || (deadlineDate.getTime() - now.getTime()) <= (24 * 60 * 60 * 1000);
  }

  startEditing() {
    this.isEditing = true;
    this.taskTitleDraft = this.task.title;

    setTimeout(() => {
      const el = this.titleInput.nativeElement;
      el.focus();
      el.select();
      this.adjustHeight(el);
    });
  }

  async saveTitle() { //modified
    // if (this.taskTitleDraft.trim()) {
    //   const updatedTask = await firstValueFrom(
    //     this.projectService.updateTaskName(
    //       this.taskTitleDraft.trim(),
    //       this.task.id
    //     )
    //   )
    //   this.task = updatedTask;
      // console.log(this.task);
    // }
    // this.isEditing = false;
    // console.log(await this.saveChanges());
    await this.saveChanges();
    // console.log(this.task);
    this.isEditing = false;
  }

  cancelEditing() {
    this.isEditing = false;
  }

  adjustHeight(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

isModalOpen = false;
shallowTaskCopy: Task | null =  null
openEditModal() {
  this.shallowTaskCopy = {...this.task}
  // this.shallowTaskCopy = JSON.parse(JSON.stringify(this.task));
  this.isModalOpen = true;
}

closeModal() {
  this.isModalOpen = false;
  this.shallowTaskCopy = null;
}

async saveTask(updatedTask: Task) {
  // console.log(updatedTask)
  const { attachments, taskLabels, ...taskWithoutAttachments } = updatedTask;
  // console.log(taskWithoutAttachments)
  await this.saveChanges(taskWithoutAttachments);
  this.task = updatedTask;
  // this.originalTask = { ...updatedTask };
  // console.log(this.task);
  this.isModalOpen = false;
}


originalTask!: Task;

ngOnInit() {
  this.originalTask = { ...this.task }; // shallow copy or deep copy
}

async saveChanges(task:Task = this.task) {
      console.log(this.originalTask)
      console.log(task)
  const updatedTask = await firstValueFrom(
    this.projectService.updateTask(this.task.id, this.originalTask, task)
  );
  return updatedTask;
  this.task = updatedTask;
  this.originalTask = { ...updatedTask }; // reset original copy
}

@Output() labelsChanged = new EventEmitter<Label[]>();

onLabelsChanged(updated: Label[]) {
  this.labelsChanged.emit(updated);
}
}
