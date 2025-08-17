import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Task } from 'src/app/models/project';
import { ProjectMemberDto, ProjectService } from 'src/app/services/project-service/project.service';

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.css']
})
export class TaskCardComponent {
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

  async saveTitle() {
    if (this.taskTitleDraft.trim()) {
      const updatedTask = await firstValueFrom(
        this.projectService.updateTaskName(
          this.taskTitleDraft.trim(),
          this.task.id
        )
      )
      this.task = updatedTask;
    }
    this.isEditing = false;
  }

  cancelEditing() {
    this.isEditing = false;
  }

  adjustHeight(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }
}
