import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, Output, EventEmitter, OnInit, ElementRef, ViewChild, ViewChildren, QueryList, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs';
import { Task, TaskLabel, Label, AttachmentDto, Comment } from 'src/app/models/project';
import { ProjectMemberDto, ProjectService } from 'src/app/services/project-service/project.service';
import { UserService } from 'src/app/services/user-service/user.service';

export interface LabelsChangedPayload {
  projectLabels: Label[];
  currentTask: Task;
}

@Component({
  selector: 'app-task-modal',
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.css'],
  animations: [
    trigger('commentAnim', [
      transition(':enter', [
        // Start slightly above
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        // Animate down to its place
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        // Fade out and slide up slightly when removed
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class TaskModalComponent implements OnInit {
  @Input() projectLabels!: Label[];
  @Input() task!: Task;
  @Input() columnName!: string;
  @Input() projectMembers: ProjectMemberDto[] = [];
  @Input() createdBy?: ProjectMemberDto;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Task>();
  @Output() commentUpdated = new EventEmitter<Comment[]>(); // New event for comment updates
  @Output() labelsChanged = new EventEmitter<LabelsChangedPayload>

  activeMenu: 'calendar' | 'showLabel' | 'editLabel' | 'assignee' | '' = '';
  activeTab: 'comments' | 'attachments' = 'comments';
  assignee: ProjectMemberDto | undefined;
  comments: Comment[] = [];
  newComment: string = '';
  editingCommentId: number | null = null;
  editingCommentContent: string = '';
  loggedInUserId: number = 0;
  showDeleteConfirm: number | null = null;
  selectedStatus: string | null = null;
  selectedPriority: string | null = null;
  editingLabel?: Label;
  uploading = false;
  modalMouseDownInside = false;
  titleError!: boolean;

  @ViewChild('commentsContainer') commentsContainer!: ElementRef;
  @ViewChild('editCommentInput') editCommentInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChildren('commentContainers') commentContainers!: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChild('modalElement') modalElement!: ElementRef;

  @ViewChild('showLabelMenu') labelMenu?: ElementRef;
  @ViewChildren('showLabelToggleBtn') showLabelToggleBtn?: QueryList<ElementRef>;
  @ViewChild('showLabelToggleBtn2') showLabelToggleBtn2?: ElementRef;
  @ViewChild('labelSection') labelSection?: ElementRef;

  @ViewChild('editLabelMenu') editLabelMenu?: ElementRef;

  @ViewChild('calendarMenu') calendarMenu?: ElementRef;
  @ViewChild('calendarToggleBtn') calendarToggleBtn?: ElementRef;

  @ViewChild('assigneeMenu') assigneeMenu?: ElementRef;
  @ViewChild('assigneeToggleBtn') assigneeToggleBtn?: ElementRef;
  @ViewChild('assigneeToggleBtn2') assigneeToggleBtn2?: ElementRef;

  @ViewChild('taskTitle') taskTitle!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('taskDesc') taskDesc!: ElementRef<HTMLTextAreaElement>;

  @ViewChild('underline') underline!: ElementRef;
  @ViewChild('tab1') tab1!: ElementRef;
  @ViewChild('tab2') tab2!: ElementRef;


  today = new Date();
  currentMonth = this.today.getMonth();
  currentYear = this.today.getFullYear();
  months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  calendarDays: { date: Date; currentMonth: boolean; disabled: boolean }[] = [];
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
    '#B3BAC5',  // gray

    '#1E90FF', // Sky Blue
    '#20C997', // Turquoise
    '#FF851B', // Bright Orange
    '#2ECC40', // Lime Green
    '#FFD93D', // Golden Yellow
    '#FF4D6D', // Coral Red
    '#A7C7E7', // Pastel Blue
    '#A8E6CF', // Mint Green
    '#FFD6A5', // Peach
    '#CDB4DB', // Lavender
    '#FFB5E8', // Soft Pink
    '#6C757D'  // Slate Gray (neutral)
  ];
  labelForm: Label = { name: '', color: '' };


  constructor(private projectService: ProjectService, private route: ActivatedRoute, private userService: UserService, private zone: NgZone) { }

  ngOnInit(): void {
    this.loadComments();
    this.generateCalendar(this.currentMonth, this.currentYear);
    this.selectedPriority = this.mapPriorityToFrontend(this.task.priority);

    if (this.task.assignedTo && this.projectMembers.length) {
      this.assignee = this.projectMembers.find(member => member.userId === this.task.assignedTo);
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

  addComment(): void {
    const content = this.newComment.trim();
    if (!content) return;

    // Build a temporary comment for UI
    const tempId = -Date.now();
    const user = this.userService.getCurrentUserValue();
    const tempComment: Comment = {
      id: tempId, // cast to match your type
      content,
      taskId: this.task.id,
      taskTitle: this.task.title,
      userId: this.getCurrentUserId(),
      userFullName: `${user?.firstName} ${user?.lastName}`,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    this.comments = [...this.comments, tempComment];
    this.task.comments = this.comments;
    this.newComment = '';
    this.commentUpdated.emit(this.comments);
    setTimeout(() => this.scrollToTop(), 0);

    // Send to server
    this.projectService.createComment({
      content,
      taskId: this.task.id,
      userId: this.getCurrentUserId(),
    }).subscribe({
      next: (comment: Comment) => {
        // Update temp comment in place
        const temp = this.comments.find(c => c.id === tempId);
        if (temp) {
          Object.assign(temp, comment);
        }
        this.task.comments = this.comments;
        this.commentUpdated.emit(this.comments);
      },
      error: (err) => {
        console.error('Failed to add comment', err);
        // Rollback: remove the temp comment
        this.comments = this.comments.filter(c => c.id !== tempId);
        this.task.comments = this.comments;
        this.commentUpdated.emit(this.comments);
      }
    });
  }

  startEditingComment(comment: Comment): void {
    if (this.editingCommentId === comment.id) {
      this.cancelEditingComment();
    } else {
      this.editingCommentId = comment.id;
      this.editingCommentContent = comment.content;
    }
    setTimeout(() => {
      if (this.editCommentInput) {
        const el = this.editCommentInput.nativeElement;
        el.focus();

        // ✅ trigger auto-resize immediately
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
      }
    });
  }

  saveComment(commentId: number): void {
    if (!this.editingCommentContent.trim()) return;
    //optimistic modifying
    this.comments = this.comments.map((c) =>
      c.id === commentId ? { ...c, content: this.editingCommentContent } : c
    );

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
    const commentId = this.editingCommentId;
    this.editingCommentId = null;
    this.editingCommentContent = '';

    setTimeout(() => {
      const el = this.commentContainers.find(c => c.nativeElement.dataset['id'] == commentId?.toString())?.nativeElement;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  deleteComment(commentId: number): void {
    //optimistic delete
    this.comments = this.comments.filter((c) => c.id !== commentId);
    this.projectService.deleteComment(commentId).subscribe({
      next: () => {
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

  //archive

  archiveTask(): void {
    this.task.isArchived = true;
    this.saveChanges();
  }

  //should be implemented correctly
  removeAssignee(): void {
    this.task.assignedTo = null;
    this.assignee = undefined;
  }

  openAssigneeMenu() {
    this.activeMenu = 'assignee';
  }

  assignTo(member: ProjectMemberDto) {
    this.task.assignedTo = member.userId;
    this.assignee = member;
    this.activeMenu = '';
  }

  onTitleInput(value: string) {
    this.titleError = !value.trim();
  }

  saveChanges(): void {
    const trimmedTitle = this.task.title?.trim() || '';

    // Always require title
    if (!trimmedTitle) {
      this.titleError = true;
      return;
    }

    // Keep description null if it’s empty or just spaces
    const trimmedDescription = this.task.description?.trim();
    const normalizedDescription = trimmedDescription ? trimmedDescription : null;

    const updatedTask: Task = {
      ...this.task,
      title: trimmedTitle,
      description: normalizedDescription,
      priority: this.mapPriorityToBackend(this.selectedPriority),
    };

    this.save.emit(updatedTask);
  }

  //calendar
  toggleCalendar() {
    this.activeMenu = this.activeMenu === 'calendar' ? '' : 'calendar';
  }

  generateCalendar(month: number, year: number) {
    this.calendarDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize

    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    const startDay = (firstDay === 0 ? 6 : firstDay - 1); // shift to Monday

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Previous month filler → always disabled
    for (let i = startDay; i > 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i + 1);
      this.calendarDays.push({ date, currentMonth: false, disabled: true });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const disabled = date < today; // disable past
      this.calendarDays.push({ date, currentMonth: true, disabled });
    }

    // Next month filler → only disable if before today
    const remaining = 7 - (this.calendarDays.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const date = new Date(year, month + 1, i);
        const disabled = date < today; // 👈 key change
        this.calendarDays.push({ date, currentMonth: false, disabled });
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
    this.activeMenu = '';
  }

  isSelected(day: { date: Date }) {
    return this.task.deadline &&
      day.date.toDateString() === new Date(this.task.deadline).toDateString();
  }

  selectToday() {
    this.task.deadline = this.toLocalDateString(new Date());
    this.activeMenu = '';
  }

  clearDeadline(event: MouseEvent) {
    event.stopPropagation(); // prevent toggleCalendar firing
    this.task.deadline = null;
  }

  selectStatus(status: string) {
    this.selectedStatus = status;
  }

  selectPriority(priority: string) {
    this.selectedPriority = priority;
  }

  getMenuPosition(reference: string): string {
    if ((this.activeMenu !== 'calendar' && this.activeMenu !== 'assignee') || !this.modalElement) return '';

    // Get the position of the calendar icon relative to the modal
    const icon = document.querySelector(reference);
    if (!icon) return 'right: 1rem; bottom: 1rem;';

    const rect = icon.getBoundingClientRect();
    const modalRect = this.modalElement.nativeElement.getBoundingClientRect();

    // Calculate position relative to modal
    const top = rect.bottom - modalRect.top; // Adjust the number as needed
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
      case 'Élevée': return 'High';
      case 'Moyenne': return 'Medium';
      case 'Faible': return 'Low';
      case 'Aucune': return null;
      default: return null;
    }
  }

  // Map from Backend → French (UI)
  mapPriorityToFrontend(priority: string | null) {
    switch (priority) {
      case 'Élevée': return 'Haute';
      case 'Medium': return 'Moyenne';
      case 'Low': return 'Faible';
      case null: return 'Aucune';
      default: return 'Aucune';
    }
  }

  toLocalDateOnly(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  //labels

  toggleLabelMenu() {
    this.activeMenu = this.activeMenu === 'showLabel' || this.activeMenu === 'editLabel' ? '' : 'showLabel';
  }

  editLabel(label: Label) {
    this.editingLabel = label;
    this.labelForm = { id: label.id, name: label.name, color: label.color };
    this.activeMenu = 'editLabel'
  }

  startAddingLabel() {
    this.editingLabel = undefined;
    this.labelForm = { id: 0, name: '', color: this.labelColors[0] };
    this.activeMenu = 'editLabel';
  }

  saveLabel() {

    if (this.editingLabel) {
      // ✅ Update existing label
      this.projectService.updateLabel(this.labelForm.id!, {
        name: this.labelForm.name,
        color: this.labelForm.color,
        projectId: Number(this.route.snapshot.paramMap.get('id'))
      }).subscribe({
        next: (updated) => {
          this.projectLabels = this.projectLabels.map(l => l.id === this.labelForm.id ? this.labelForm : l);
          this.task.taskLabels!.find(tl => tl.labelId === this.labelForm.id)!.label = this.labelForm;
          this.labelsChanged.emit({
            projectLabels: this.projectLabels,
            currentTask: this.task
          });
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
                ...this.task.taskLabels!,
                { ...taskLabel, label: created } // 👈 inject full label
              ];

              // 3. Emit to parent so card updates
              this.labelsChanged.emit({
                projectLabels: this.projectLabels,
                currentTask: this.task
              });

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
          this.task.taskLabels = this.task.taskLabels!.filter(l => l.labelId !== this.editingLabel!.id);
          this.labelsChanged.emit({
            projectLabels: this.projectLabels,
            currentTask: this.task
          });
          this.cancelLabelEdit();
        },
        error: (err) => {
          console.error('Failed to delete label', err);
        }
      });
    }
  }

  cancelLabelEdit() {
    this.activeMenu = 'showLabel';
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
      // Add label mapping
      this.projectService.createTaskLabelMapping(this.task.id, label.id).subscribe({
        next: (mapping) => {
          // attach the label if API doesn't return it
          if (!mapping.label) {
            mapping.label = label;
          }
          // avoid duplicates
          const exists = this.task.taskLabels!.some(tl => tl.label?.id === label.id);
          if (!exists) {
            this.task.taskLabels!.push(mapping);
          }
        },
        error: (err) => console.error('Failed to add label', err),
      });

    } else {
      // Remove label mapping
      const idx = this.task.taskLabels!.findIndex(tl => tl.label?.id === label.id);
      if (idx > -1) {
        // optimistic remove
        const removed = this.task.taskLabels!.splice(idx, 1)[0];

        this.projectService.deleteTaskLabelMapping(this.task.id, label.id).subscribe({
          error: (err) => {
            console.error('Failed to remove label', err);
            // revert if server call fails
            this.task.taskLabels!.splice(idx, 0, removed);
          }
        });
      }
    }
  }

  onFileSelected(event: any) {
    const input = event.target as HTMLInputElement;
    const file: File | null = input.files && input.files[0] ? input.files[0] : null;
    if (!file) return;

    this.uploading = true;
    this.projectService.uploadAttachment(this.task.id, file).subscribe({
      next: att => {
        this.task.attachments!.push(att);
        this.uploading = false;
        input.value = ''; // reset so selecting the same file again works
      },
      error: () => {
        this.uploading = false;
        input.value = ''; // also reset on error
      }
    });
  }


  deleteAttachment(att: AttachmentDto) {
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

  getLabelMenuPosition(): string {
    const icon = this.labelSection?.nativeElement;
    if (!icon) return 'right: 1rem; bottom: 1rem';

    const rect = icon.getBoundingClientRect();
    const modalRect = this.modalElement.nativeElement.getBoundingClientRect();

    // Calculate position relative to modal
    const top = rect.bottom - modalRect.top + 4;
    const left = rect.left - modalRect.left;

    return `top: ${top}px; left: ${left}px;`;
  }

  onModalMouseDown(event: MouseEvent) {
    this.modalMouseDownInside = true;
  }

  onModalMouseUp(event: MouseEvent) {
    this.modalMouseDownInside = false
  }

  onBackdropClick(event: MouseEvent) {
    if (this.modalMouseDownInside) {
      this.modalMouseDownInside = false
      // Ignore click — it started inside modal
      return;
    }
    this.saveChanges();
  }

  onModalRootClick(event: MouseEvent) {
    const t = event.target as Node;
    const inside = (el?: ElementRef | QueryList<ElementRef>) => {
      if (!el) return false;
      if (el instanceof QueryList) {
        return el.some(e => e.nativeElement.contains(t));
      }
      return el.nativeElement.contains(t);
    };

    const inAnyMenu =
      inside(this.labelMenu) ||
      inside(this.editLabelMenu) ||
      inside(this.calendarMenu) ||
      inside(this.assigneeMenu);

    const inAnyToggle =
      inside(this.showLabelToggleBtn) ||
      inside(this.showLabelToggleBtn2) ||
      inside(this.calendarToggleBtn) ||
      inside(this.assigneeToggleBtn) ||
      inside(this.assigneeToggleBtn2);

    // Clicked somewhere inside the modal that is NOT a menu and NOT a toggle → close open menu
    if (this.activeMenu && !inAnyMenu && !inAnyToggle) {
      this.activeMenu = '';
    }

    // keep clicks inside from reaching the backdrop
    event.stopPropagation();
  }

  ///resizing on init (title and description)

  ngAfterViewInit() {
    this.zone.onStable
      .pipe(take(1)) // only once
      .subscribe(() => {
        this.resizeAll();
        this.updateUnderline();
      });
  }

  resizeAll() {
    if (this.taskTitle) this.resize(this.taskTitle.nativeElement);
    if (this.taskDesc) this.resize(this.taskDesc.nativeElement);
  }

  resize(el: HTMLTextAreaElement | EventTarget | null) {
    const textarea = (el instanceof HTMLTextAreaElement) ? el : (el as any)?.nativeElement ?? null;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }


  downloadAttachment(att: AttachmentDto) {
    fetch(att.fileUrl, { mode: 'cors' })  // fetch the file
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = att.fileName;
        link.click();
        window.URL.revokeObjectURL(url); // cleanup
      })
      .catch(err => console.error('Download failed', err));
  }

  selectTab(tab: 'comments' | 'attachments') {
    this.activeTab = tab;
    this.updateUnderline();
  }

  updateUnderline() {
    const el = this.activeTab === 'comments' ? this.tab1.nativeElement : this.tab2.nativeElement;
    const underlineEl = this.underline.nativeElement;

    underlineEl.style.width = `${el.offsetWidth}px`
    underlineEl.style.left = `${el.offsetLeft}px`;
  }

}
