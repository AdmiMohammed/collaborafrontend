import { Component, Input, Output, EventEmitter, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Task, TaskLabel, Label, AttachmentDto, Comment } from 'src/app/models/project';
import { ProjectMemberDto, ProjectService } from 'src/app/services/project-service/project.service';
import { UserService } from 'src/app/services/user-service/user.service';

@Component({
  selector: 'app-task-modal',
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.css']
})
export class TaskModalComponent implements OnInit {
  @ViewChild('commentsContainer') commentsContainer!: ElementRef;
  @Input() projectLabels!: Label[];
  @Input() task!: Task;
  @Input() columnName!: string;
  @Input() projectMembers: ProjectMemberDto[] = [];
  @Input() createdBy?: ProjectMemberDto;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Task>();
  @Output() move = new EventEmitter<void>();
  @Output() archive = new EventEmitter<void>();
  @Output() commentUpdated = new EventEmitter<Comment[]>(); // New event for comment updates
  @ViewChild('modalElement') modalElement!: ElementRef;

  showMenu = false;
  activeTab: 'comments' | 'attachments' = 'comments';
  assignees: ProjectMemberDto[] = [];
  comments: Comment[] = [];
  newComment: string = '';
  editingCommentId: number | null = null;
  editingCommentContent: string = '';
  loggedInUserId: number = 0;
  showDeleteConfirm: number | null = null;

  ngOnInit(): void {
    this.loadComments();
    this.generateCalendar(this.currentMonth, this.currentYear);
    this.selectedPriority = this.mapPriorityToFrontend(this.task.priority);

    if (this.task.assignedTo && this.projectMembers.length) {
      const assignee = this.projectMembers.find(member => member.userId === this.task.assignedTo);
      if (assignee) {
        this.assignees = [assignee];
      }
    }

    if (!this.task.comments) {
      this.task.comments = [];
    }

    this.userService.fetchCurrentUser().subscribe({
      next: (user) => {
        this.loggedInUserId = user.id;
      },
      error: (err) => {
        console.error('Failed to fetch current user', err);
        this.loggedInUserId = 0;
      }
    });
  }


  getCurrentUserId(): number {
    const user = this.userService.getCurrentUserValue();
    return user ? user.id : 0;
  }

  getMemberById(id: number): ProjectMemberDto | undefined {
    return this.projectMembers.find(m => m.userId === id);
  }

 // Ajoutez cette méthode pour inverser l'ordre des commentaires
reversedComments(): Comment[] {
  return [...this.comments].reverse();
}

// La méthode scrollToTop() reste inchangée
scrollToTop(): void {
  try {
    if (this.commentsContainer) {
      this.commentsContainer.nativeElement.scrollTop = 0;
    }
  } catch (err) { }
}

// Modifiez la méthode loadComments() pour trier les commentaires du plus ancien au plus récent
loadComments(): void {
  this.projectService.getCommentsByTaskId(this.task.id).subscribe({
    next: (comments: Comment[]) => {
      // Trier les commentaires du plus ancien au plus récent
      this.comments = comments.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      this.task.comments = this.comments;
      this.commentUpdated.emit(this.comments);
      setTimeout(() => this.scrollToTop(), 0);
    },
    error: (err) => console.error('Failed to load comments', err),
  });
}

// Modifiez la méthode addComment() pour ajouter le nouveau commentaire à la fin
addComment(): void {
  if (!this.newComment.trim()) return;

  this.projectService.createComment({
    content: this.newComment,
    taskId: this.task.id,
    userId: this.getCurrentUserId(),
  }).subscribe({
    next: (comment: Comment) => {
      // Ajouter le nouveau commentaire à la fin du tableau
      this.comments = [...this.comments, comment];
      this.task.comments = this.comments;
      this.newComment = '';
      this.commentUpdated.emit(this.comments);
      setTimeout(() => this.scrollToTop(), 0);
    },
    
    error: (err) => console.error('Failed to add comment', err),
  });
}

  startEditingComment(comment: Comment): void {
    if (this.editingCommentId === comment.id) {
      this.cancelEditingComment();
    } else {
      this.editingCommentId = comment.id;
      this.editingCommentContent = comment.content;
    }
  }

  saveComment(commentId: number): void {
    if (!this.editingCommentContent.trim()) return;

    this.projectService.updateComment(commentId, { content: this.editingCommentContent }).subscribe({
      next: (updatedComment: Comment) => {
        this.comments = this.comments.map((c) =>
          c.id === commentId ? updatedComment : c
        );
        this.task.comments = this.comments;
        this.editingCommentId = null;
        this.editingCommentContent = '';
        this.commentUpdated.emit(this.comments);
      },
      error: (err) => console.error('Failed to update comment', err),
    });
  }

  cancelEditingComment(): void {
    this.editingCommentId = null;
    this.editingCommentContent = '';
  }

  deleteComment(commentId: number): void {
    this.projectService.deleteComment(commentId).subscribe({
      next: () => {
        this.comments = this.comments.filter((c) => c.id !== commentId);
        this.task.comments = this.comments;
        this.commentUpdated.emit(this.comments);
      },
      error: (err) => console.error('Failed to delete comment', err),
    });
  }

  toggleDeleteConfirm(commentId: number): void {
    this.showDeleteConfirm = this.showDeleteConfirm === commentId ? null : commentId;
  }

  confirmDelete(commentId: number): void {
    this.deleteComment(commentId);
    this.showDeleteConfirm = null;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = null;
  }

  closeModal(): void {
    this.close.emit();
  }

  //options
  toggleMenu(): void {
    this.showMenu = !this.showMenu;
  }

  moveTask(): void {
    this.move.emit();
    this.showMenu = false;
  }

  archiveTask(): void {
    this.archive.emit();
    this.showMenu = false;
  }

  //should be implemented
  addLabel(): void {
    // Implementation for adding labels would go here
    console.log('Add label functionality');
  }
  //should be implemented
  addAssignee(): void {
    // Implementation for adding assignees would go here
    console.log('Add assignee functionality');
  }

  //should be implemented correctly
  removeAssignee(assignee: ProjectMemberDto): void {
    this.assignees = this.assignees.filter(a => a.userId !== assignee.userId);
    // Update the task's assignedTo field if needed
    if (this.assignees.length === 0) {
      this.task.assignedTo = 0;
    }
  }

  //the most important one
  saveChanges(): void {
    const updatedTask: Task = {
      ...this.task,
      priority: this.mapPriorityToBackend(this.selectedPriority),
    };

    this.save.emit(updatedTask);
  }


  //calendar
  calendarOpen = false;

  today = new Date();
  currentMonth = this.today.getMonth();
  currentYear = this.today.getFullYear();

  months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  calendarDays: { date: Date; currentMonth: boolean; disabled: boolean }[] = [];

  toggleCalendar() {
    this.calendarOpen = !this.calendarOpen;
  }

  generateCalendar(month: number, year: number) {
    this.calendarDays = [];
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    const startDay = (firstDay === 0 ? 6 : firstDay - 1); // shift to Monday

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Previous month filler
    for (let i = startDay; i > 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i + 1);
      this.calendarDays.push({ date, currentMonth: false, disabled: true });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const disabled = date < new Date(this.today.setHours(0, 0, 0, 0)); // no past
      this.calendarDays.push({ date, currentMonth: true, disabled });
    }

    // Next month filler
    const remaining = 7 - (this.calendarDays.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const date = new Date(year, month + 1, i);
        this.calendarDays.push({ date, currentMonth: false, disabled: true });
      }
    }
  }

  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar(this.currentMonth, this.currentYear);
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar(this.currentMonth, this.currentYear);
  }

  selectDate(day: { date: Date; disabled: boolean }) {
    if (day.disabled) return;
    this.task.deadline = this.toLocalDateString(day.date);
    this.calendarOpen = false;
  }

  isSelected(day: { date: Date }) {
    return this.task.deadline &&
      day.date.toDateString() === new Date(this.task.deadline).toDateString();
  }
  selectToday() {
    this.task.deadline = this.toLocalDateString(new Date());
    console.log(this.task.deadline)
    this.calendarOpen = false;
  }

  selectedStatus: string | null = null;
  selectedPriority: string | null = null;

  selectStatus(status: string) {
    this.selectedStatus = status;
  }

  selectPriority(priority: string) {
    this.selectedPriority = priority;
  }

  getCalendarPosition(): string {
    if (!this.calendarOpen || !this.modalElement) return '';

    // Get the position of the calendar icon relative to the modal
    const icon = document.querySelector('#calendarIcon');
    if (!icon) return 'right: 1rem; bottom: 1rem;';

    const rect = icon.getBoundingClientRect();
    const modalRect = this.modalElement.nativeElement.getBoundingClientRect();

    // Calculate position relative to modal
    const top = rect.bottom - modalRect.top + 4; // Adjust the number as needed
    const right = modalRect.right - rect.right;

    return `top: ${top}px; right: ${right}px;`;
  }


  toLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }




  // Map from French (UI) → Backend
  mapPriorityToBackend(priority: string | null) {
    switch (priority) {
      case 'Haute': return 'High';
      case 'Moyenne': return 'Medium';
      case 'Basse': return 'Low';
      case 'Aucune': return null;
      default: return null;
    }
  }

  // Map from Backend → French (UI)
  mapPriorityToFrontend(priority: string | null) {
    switch (priority) {
      case 'High': return 'Haute';
      case 'Medium': return 'Moyenne';
      case 'Low': return 'Basse';
      case null: return 'Aucune';
      default: return 'Aucune';
    }
  }

  toLocalDateOnly(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }





  //labels
  // A Trello-like palette
  constructor(private projectService: ProjectService, private route: ActivatedRoute, private userService: UserService) { }

  labelColors: readonly string[] = [
    '#61BD4F', // green
    '#F2D600', // yellow
    '#FF9F1A', // orange
    '#EB5A46', // red
    '#C377E0', // purple
    '#0079BF', // blue
    '#00C2E0', // sky
    '#51E898', // lime
    '#FF78CB', // pink
    '#344563', // navy-ish
    '#B3BAC5'  // gray
  ];

  // allLabels: TaskLabel[] = []          // Provided via @Input
  showLabelMenu = false;
  labelEditorOpen = false;
  labelForm: Label = { name: '', color: '' };
  editingLabel?: Label;

  toggleLabelMenu() {
    this.showLabelMenu = !this.showLabelMenu;
    this.labelEditorOpen = false;
  }

  editLabel(label: Label) {
    this.editingLabel = label;
    this.labelForm = { id: label.id, name: label.name, color: label.color };
    this.labelEditorOpen = true;
  }

  startAddingLabel() {
    this.editingLabel = undefined;
    this.labelForm = { id: 0, name: '', color: this.labelColors[0] };
    this.labelEditorOpen = true;
  }

  saveLabel() {
    // if (!this.labelForm.name.trim()) return;

    if (this.editingLabel) {
      // ✅ Update existing label
      this.projectService.updateLabel(this.labelForm.id!, {
        name: this.labelForm.name,
        color: this.labelForm.color,
        projectId: Number(this.route.snapshot.paramMap.get('id'))
      }).subscribe({
        next: (updated) => {
          // update UI in place
          const idx = this.projectLabels.findIndex(l => l.id === this.labelForm.id);
          if (idx !== -1) this.projectLabels[idx] = this.labelForm;
          this.cancelLabelEdit();
        },
        error: (err) => console.error('Failed to update label', err)
      });

    } else {
this.projectService.createLabel({
  name: this.labelForm.name,
  color: this.labelForm.color,
  projectId: Number(this.route.snapshot.paramMap.get('id'))
}).subscribe({
  next: (created) => {
    // 1. Update project labels immutably
    this.projectLabels = [...this.projectLabels, created];

    // 2. Create mapping and hydrate with full label
    this.projectService.createTaskLabelMapping(this.task.id, created.id!).subscribe({
      next: (taskLabel) => {
        this.task.taskLabels = [
          ...this.task.taskLabels,
          { ...taskLabel, label: created } // 👈 inject full label
        ];
       this.cancelLabelEdit();
      }
    });
  },
  error: (err) => console.error('Failed to create label', err)
});

    }
  }

  deleteLabel() {
    if (!this.editingLabel) return;
    if (this.editingLabel.id) {
      this.projectService.deleteLabel(this.editingLabel.id).subscribe({
        next: () => {
          // Remove from UI
          this.projectLabels = this.projectLabels.filter(l => l.id !== this.editingLabel!.id);
          this.task.taskLabels = this.task.taskLabels.filter(l => l.labelId !== this.editingLabel!.id);
          this.cancelLabelEdit();
        },
        error: (err) => {
          console.error('Failed to delete label', err);
        }
      });
    }
  }

  cancelLabelEdit() {
    this.labelEditorOpen = false;
  }

  isTaskLabelChecked(label: Label): boolean {
  return this.task?.taskLabels?.some(tl => tl.label.id === label.id) ?? false;
}

// processingLabelIds = new Set<number>();
toggleTaskLabel(label: Label, ev: Event) {
  ev.stopPropagation();
  if (!label?.id) return;

  const isChecked = this.isTaskLabelChecked(label);

  if (!isChecked) {
    // ✅ Add label mapping
    this.projectService.createTaskLabelMapping(this.task.id, label.id).subscribe({
      next: (mapping) => {
        // attach the label if API doesn't return it
        if (!mapping.label) {
          mapping.label = label;
        }
        // avoid duplicates
        const exists = this.task.taskLabels.some(tl => tl.label?.id === label.id);
        if (!exists) {
          this.task.taskLabels.push(mapping);
        }
      },
      error: (err) => console.error('Failed to add label', err),
    });

  } else {
    // ❌ Remove label mapping
    const idx = this.task.taskLabels.findIndex(tl => tl.label?.id === label.id);
    if (idx > -1) {
      // optimistic remove
      const removed = this.task.taskLabels.splice(idx, 1)[0];

      this.projectService.deleteTaskLabelMapping(this.task.id, label.id).subscribe({
        error: (err) => {
          console.error('Failed to remove label', err);
          // revert if server call fails
          this.task.taskLabels.splice(idx, 0, removed);
        }
      });
    }
  }
}

//attachments
  uploading = false;

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.uploading = true;
    this.projectService.uploadAttachment(this.task.id, file).subscribe(att => {
      this.task.attachments!.push(att);
      this.uploading = false;
    }, () => this.uploading = false);
  }

  deleteAttachment(att: AttachmentDto) {
    // if (!confirm(`Supprimer "${att.fileName}" ?`)) return;
    this.projectService.deleteAttachment(att.id).subscribe(() => {
      this.task.attachments = this.task.attachments!.filter(a => a.id !== att.id);
    });
  }

  formatSize(size?: number) {
    if (!size) return '';
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
  }
}