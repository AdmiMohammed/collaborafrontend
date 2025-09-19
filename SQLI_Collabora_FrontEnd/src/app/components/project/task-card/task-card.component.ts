import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Label, Task } from 'src/app/models/project';
import { ProjectMemberDto, ProjectService } from 'src/app/services/project-service/project.service';
import { LabelsChangedPayload } from '../task-modal/task-modal.component';

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.component.html',
  styleUrls: []
})
export class TaskCardComponent {
  @Input() projectLabels!: Label[];
  @Input() columnName!: string;
  @Input() task!: Task;
  @Input() members: ProjectMemberDto[] = [];
  @Output() labelsChanged = new EventEmitter<Label[]>();
  @ViewChild('titleInput') titleInput!: ElementRef<HTMLTextAreaElement>;

  isModalOpen = false;
  shallowTaskCopy: Task | null = null
  isEditing = false;
  taskTitleDraft = '';
  originalTask!: Task;

  priorityLabels: Record<string, string> = {
    Low: 'Faible',
    Medium: 'Moyenne',
    High: 'Élevée'
  };

  constructor(private projectService: ProjectService) { }

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

  async saveTitle() {
    this.task.title = this.taskTitleDraft.trim();
    await this.saveTask(this.task);
    this.isEditing = false;
  }

  cancelEditing() {
    this.isEditing = false;
  }

  adjustHeight(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  openEditModal() {
    this.shallowTaskCopy = { ...this.task }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.shallowTaskCopy = null;
  }

  async saveTask(updatedTask: Task) {
    this.isModalOpen = false;
    const { attachments, comments, taskLabels, ...restOfFields } = updatedTask;
    await this.saveChanges(restOfFields);
    Object.assign(this.task, updatedTask);
  }

  ngOnInit() {
    this.originalTask = { ...this.task }; // shallow copy or deep copy
    this.loadComments();
  }

  onLabelsChanged(updated: LabelsChangedPayload) {
    this.task.taskLabels = updated.currentTask.taskLabels;
    this.labelsChanged.emit(updated.projectLabels);
  }

  loadComments(): void {
    this.projectService.getCommentsByTaskId(this.task.id).subscribe({
      next: (comments) => {
        this.task.comments = comments;
      },
      error: (err) => console.error('Failed to load comments', err),
    });
  }

  async saveChanges(task: Task = this.task) {
    const updatedTask = await firstValueFrom(
      this.projectService.updateTask(this.task.id, this.originalTask, task)
    );

    Object.assign(this.task, updatedTask);

    this.task.comments = this.task.comments;

    Object.assign(this.originalTask, updatedTask);
    this.originalTask.comments = this.task.comments;

    return updatedTask;
  }
}
