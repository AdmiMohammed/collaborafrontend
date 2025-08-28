// task-modal.component.ts
import { Component, Input, Output, EventEmitter, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Task, TaskLabel, Label, AttachmentDto } from 'src/app/models/project';
import { ProjectMemberDto, ProjectService } from 'src/app/services/project-service/project.service';

@Component({
  selector: 'app-task-modal',
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.css']
})
export class TaskModalComponent implements OnInit {
  @Input() projectLabels!: Label[];
  @Input() task!: Task;
  @Input() columnName!: string;
  @Input() projectMembers: ProjectMemberDto[] = [];
  @Input() createdBy?: ProjectMemberDto;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Task>();
  @Output() move = new EventEmitter<void>();
  @Output() archive = new EventEmitter<void>();
  @ViewChild('modalElement') modalElement!: ElementRef;

  // showMenu = false;
  activeMenu: 'calendar' | 'showLabel' | 'editLabel' | 'options' | '' = '';
  activeTab: 'comments' | 'attachments' = 'comments';
  assignees: ProjectMemberDto[] = [];
  // deadlineString: string = ''; // For the date input

  ngOnInit(): void {
    this.generateCalendar(this.currentMonth, this.currentYear);

    this.selectedPriority = this.mapPriorityToFrontend(this.task.priority);
    // Initialize assignees from the task data
    if (this.task.assignedTo && this.projectMembers.length) {
      const assignee = this.projectMembers.find(member => member.userId === this.task.assignedTo);
      if (assignee) {
        this.assignees = [assignee];
      }
    }

    // this.allLabels = this.task.taskLabels; 
  }

  //don't know if it's going to be needed
  closeModal(): void {
    this.close.emit();
  }

  //options
  toggleMenu(): void {
    this.activeMenu = this.activeMenu === 'options' ? '' : 'options';
  }

  moveTask(): void {
    this.move.emit();
    this.activeMenu = '';
  }

  archiveTask(): void {
    this.archive.emit();
    this.activeMenu = '';
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
      title: this.task.title?.trim(),       // remove leading/trailing spaces
      description: this.task.description?.trim(),
      priority: this.mapPriorityToBackend(this.selectedPriority),
    };

    this.save.emit(updatedTask);
  }


  //calendar

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
    this.activeMenu = this.activeMenu === 'calendar' ? '' : 'calendar';
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
    // this.calendarOpen = false;
    this.activeMenu = '';
  }

  isSelected(day: { date: Date }) {
    return this.task.deadline &&
      day.date.toDateString() === new Date(this.task.deadline).toDateString();
  }
  selectToday() {
    this.task.deadline = this.toLocalDateString(new Date());
    console.log(this.task.deadline)
    // this.calendarOpen = false;
    this.activeMenu = '';
  }

  selectedStatus: string | null = null;
  selectedPriority: string | null = null;

  selectStatus(status: string) {
    this.selectedStatus = status;
  }

  selectPriority(priority: string) {
    this.selectedPriority = priority;
    console.log(this.selectedPriority)
  }

  getCalendarPosition(): string {
    // if (!this.calendarOpen || !this.modalElement) return '';
    if (this.activeMenu !== 'calendar' || !this.modalElement) return '';

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
  @Output() labelsChanged = new EventEmitter<Label[]>
  constructor(private projectService: ProjectService, private route: ActivatedRoute) { }

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
  editingLabel?: Label;

  toggleLabelMenu() {
    this.activeMenu = this.activeMenu === 'showLabel' ? '' : 'showLabel';
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
          // const idx = this.projectLabels.findIndex(l => l.id === this.labelForm.id);
          // if (idx !== -1) this.projectLabels[idx] = this.labelForm;
          this.projectLabels = this.projectLabels.map(l => l.id === this.labelForm.id ? this.labelForm : l);
          this.task.taskLabels!.find(tl => tl.labelId === this.labelForm.id)!.label = this.labelForm;
          this.labelsChanged.emit(this.projectLabels);
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
              // this.save.emit(this.task);
              this.labelsChanged.emit(this.projectLabels);

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
          this.labelsChanged.emit(this.projectLabels);
          this.cancelLabelEdit();
        },
        error: (err) => {
          console.error('Failed to delete label', err);
        }
      });
    }
  }

  //   toggleTaskLabel(label: Label, event: Event) {
  //   const checked = (event.target as HTMLInputElement).checked;

  //   if (checked) {
  //     this.projectService.createTaskLabelMapping(this.task.id, label.id!).subscribe({
  //       next: (taskLabel) => this.task.taskLabels.push(taskLabel),
  //       error: (err) => console.error('Failed to add label to task', err)
  //     });
  //   } else {
  //     this.projectService.deleteTaskLabelMapping(this.task.id, label.id!).subscribe({
  //       next: () => {
  //         this.task.taskLabels = this.task.taskLabels.filter(tl => tl.label.id !== label.id);
  //       },
  //       error: (err) => console.error('Failed to remove label from task', err)
  //     });
  //   }
  // }

  // toggleTaskLabel(label: Label, ev: Event) {
  //   ev.stopPropagation();
  //   if (!label?.id) return;

  //   // prevent double-click storms
  //   if (this.processingLabelIds.has(label.id)) return;
  //   this.processingLabelIds.add(label.id);

  //   const isChecked = this.isTaskLabelChecked(label);

  //   if (!isChecked) {
  //     // ✅ CHECK (add mapping) – optimistic add with full label
  //     this.projectService.createTaskLabelMapping(this.task.id, label.id).subscribe({
  //       next: (mapping) => {
  //         // Ensure we inject the full label object used by the UI
  //         const hydrated = { ...mapping, label } as TaskLabel;

  //         // If array already contains it (race), skip
  //         const exists = this.task.taskLabels.some(tl => tl.label?.id === label.id);
  //         if (!exists) {
  //           // keep same array ref for the task card (shallow copy)
  //           this.task.taskLabels.push(hydrated);
  //         }
  //       },
  //       error: (err) => {
  //         console.error('Failed to add label to task', err);
  //       },
  //       complete: () => this.processingLabelIds.delete(label.id!)
  //     });

  //   } else {
  //     // ❌ UNCHECK (remove mapping) – mutate in place to keep reference shared with card
  //     const idx = this.task.taskLabels.findIndex(tl => tl.label?.id === label.id);
  //     const removed = idx > -1 ? this.task.taskLabels[idx] : undefined;

  //     if (idx > -1) {
  //       // optimistic remove
  //       this.task.taskLabels.splice(idx, 1);
  //     }

  //     this.projectService.deleteTaskLabelMapping(this.task.id, label.id).subscribe({
  //       next: () => {},
  //       error: (err) => {
  //         console.error('Failed to remove label from task', err);
  //         // revert on error
  //         if (removed) {
  //           this.task.taskLabels.splice(idx, 0, removed);
  //         }
  //       },
  //       complete: () => this.processingLabelIds.delete(label.id!)
  //     });
  //   }
  // }


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
      // ✅ Add label mapping
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
      // ❌ Remove label mapping
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


  // trackLabelBy(_: number, label: Label) {
  //   return label.id!;
  // }
  // trackTaskLabelBy(_: number, tl: TaskLabel) {
  //   return tl.label?.id ?? tl.id;
  // }









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

  //   getLabelMenuPosition(): string {
  //   if (!this.showLabelMenu || !this.modalElement) return '';

  //   const trigger = document.querySelector('button[click*="toggleLabelMenu"]');
  //   if (!trigger) return 'top: 4rem; left: 0;';

  //   const rect = trigger.getBoundingClientRect();
  //   const modalRect = this.modalElement.nativeElement.getBoundingClientRect();

  //   const top = rect.bottom - modalRect.top + 8;
  //   const left = rect.left - modalRect.left;

  //   return `top: ${top}px; left: ${left}px;`;
  // }

  getLabelMenuPosition(): string {
    // if (!this.calendarOpen || !this.modalElement) return '';

    // Get the position of the calendar icon relative to the modal
    const icon = this.showLabelToggleBtn?.nativeElement;
    if (!icon) return 'right: 1rem; bottom: 1rem;';

    const rect = icon.getBoundingClientRect();
    const modalRect = this.modalElement.nativeElement.getBoundingClientRect();

    // Calculate position relative to modal
    const top = rect.bottom - modalRect.top + 4; // Adjust the number as needed
    const left = rect.left - modalRect.left;

    return `top: ${top}px; left: ${left}px;`;
  }

  @ViewChild('optionsMenu') optionsMenu?: ElementRef;
  @ViewChild('optionsToggleBtn') optionsToggleBtn?: ElementRef;

  @ViewChild('showLabelMenu') labelMenu?: ElementRef;
  @ViewChild('showLabelToggleBtn') showLabelToggleBtn?: ElementRef;

  @ViewChild('editLabelMenu') editLabelMenu?: ElementRef;

  @ViewChild('calendarMenu') calendarMenu?: ElementRef;
  @ViewChild('calendarToggleBtn') calendarToggleBtn?: ElementRef;

  modalMouseDownInside = false;

  onModalMouseDown(event: MouseEvent) {
    console.log("mouse down called")
    this.modalMouseDownInside = true;
  }

  onModalMouseUp(event: MouseEvent) {
    console.log("mouse up called")
    this.modalMouseDownInside = false
  }

  onBackdropClick(event: MouseEvent) {
    if (this.modalMouseDownInside) {
      console.log(this.modalMouseDownInside)
      this.modalMouseDownInside = false
      // Ignore click — it started inside modal
      return;
    }
    this.closeModal();
  }
  onModalRootClick(event: MouseEvent) {
    const t = event.target as Node;
    const inside = (el?: ElementRef) => el?.nativeElement.contains(t);

    console.log(this.activeMenu)

    const inAnyMenu =
      inside(this.optionsMenu) ||
      inside(this.labelMenu) ||
      inside(this.editLabelMenu) ||
      inside(this.calendarMenu);

    console.log(inside(this.editLabelMenu))

    const inAnyToggle =
      inside(this.optionsToggleBtn) ||
      inside(this.showLabelToggleBtn) ||
      inside(this.calendarToggleBtn);

    console.log(inAnyToggle)

    // Clicked somewhere inside the modal that is NOT a menu and NOT a toggle → close open menu
    if (this.activeMenu && !inAnyMenu && !inAnyToggle) {
      this.activeMenu = '';
    }

    // keep clicks inside from reaching the backdrop
    event.stopPropagation();
  }

  ///resizing on init (title and description)

  @ViewChild('taskTitle') taskTitle!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('taskDesc') taskDesc!: ElementRef<HTMLTextAreaElement>;

  // private resizedForCurrentOpen = false;

  ngAfterViewChecked() {
    // wait for layout / rendering to settle
    this.resizeAll();
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




}
