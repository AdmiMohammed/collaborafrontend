import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import {
  FormBuilder,
  Validators,
  FormGroup,
  AbstractControl,
} from '@angular/forms';
import {
  TemplatesService,
  TemplateReadDto,
} from 'src/app/services/project-service/project-template.service';
import { UserService } from 'src/app/services/user-service/user.service';
import { ProjectService } from 'src/app/services/project-service/project.service';
import { finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';



type WizardStep = 0 | 1 | 2;

// Modèle UI (simple) pour l’affichage
interface TemplateUI {
  id: number;
  name: string;
  desc?: string | null;
  columns: string[];
}

interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
}

@Component({
  selector: 'app-project-wizard',
  templateUrl: './project-wizard.component.html',
})

export class ProjectWizardComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  isSubmitting = false;
  submitError: string | null = null;

  step: WizardStep = 0;
  steps = [
    { key: 'details', label: 'Project Details' },
    { key: 'template', label: 'Template' },
    { key: 'team', label: 'Team' },
  ];
  triedNext = false;

  form: FormGroup;

  // ⚠️ maintenant alimenté depuis le backend
  templates: TemplateUI[] = [];
  loadingTemplates = false;
  templatesError: string | null = null;
  members: { id: number; name: string; email: string; avatarUrl: string }[] =
    [];

  // on stocke l’ID du template sélectionné
  selectedTemplateId: number | null = null;

  searchTerm = '';
  calendarOpen = false;
  selectedDate: Date | null = null;
  viewYear: number = new Date().getFullYear();
  viewMonth: number = new Date().getMonth();
  weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];

  constructor(
    private fb: FormBuilder,
    private templatesSvc: TemplatesService,
    private userService: UserService,
    private projectService: ProjectService,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      details: this.fb.group({
        title: ['', Validators.required],
        description: ['', Validators.required],
        dueDate: [null], // optionnel
      }),
      template: this.fb.group({
        templateId: [null, Validators.required],
      }),
      members: this.fb.group({
        userIds: [[]], // optionnel
        search: [''], // ajout
      }),
    });


  }

  // Getters pratiques
  get details(): FormGroup {
    return this.form.get('details') as FormGroup;
  }
  get template(): FormGroup {
    return this.form.get('template') as FormGroup;
  }
  get fTitle(): AbstractControl | null {
    return this.details.get('title');
  }
  get fDescription(): AbstractControl | null {
    return this.details.get('description');
  }
  get fTemplateId(): AbstractControl | null {
    return this.template.get('templateId');
  }

  ngOnInit(): void {
    this.loadTemplates();
    this.loadMembers();
  }
  private loadMembers() {
    this.userService.getOtherUsers().subscribe((users) => {
      this.members = users.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        avatarUrl: u.profilePictureUrl || '',
      }));
    });
  }
  private loadTemplates() {
    this.loadingTemplates = true;
    this.templatesError = null;
    this.templatesSvc.getAll().subscribe({
      next: (list: TemplateReadDto[]) => {
        // map backend -> UI
        this.templates = list.map((t) => ({
          id: t.id,
          name: t.name,
          desc: t.description,
          columns: t.boards ?? [],
        }));
        this.loadingTemplates = false;
      },
      error: (err) => {
        this.templatesError =
          err?.message || 'Erreur lors du chargement des templates.';
        this.loadingTemplates = false;
      },
    });
  }

  // === Wizard nav avec validation par étape ===
  next(): void {
    if (this.step === 0) {
      if (this.details.invalid) {
        this.details.markAllAsTouched();
        return;
      }
    }
    if (this.step === 1) {
      if (this.template.invalid) {
        this.template.markAllAsTouched();
        return;
      }
    }
    if (this.step < 2) this.step = (this.step + 1) as WizardStep;
  }

  back(): void {
    if (this.step > 0) this.step = (this.step - 1) as WizardStep;
  }

  close(): void {
    this.closed.emit();
  }

  // === Soumission (ne valide que les étapes 1 et 2) ===
  submit(): void {
    this.submitError = null;

    if (this.details.invalid || this.template.invalid) {
      this.details.markAllAsTouched();
      this.template.markAllAsTouched();
      this.step = this.details.invalid ? 0 : 1;
      return;
    }

    const v = this.form.value;
    const templateId: number = v.template.templateId;
    const tpl = this.templates.find(t => t.id === templateId);
    const initialBoardCount = tpl?.columns?.length ?? 0;

    const dto = {
      name: v.details.title,
      description: v.details.description,
      startDate: new Date().toISOString(),                // maintenant
      estimatedEndDate: v.details.dueDate || null,        // déjà ISO ou null
      templateId,
      initialBoardCount,
      memberIds: (v.members.userIds || [])
    } as const;

    this.isSubmitting = true;
    this.projectService.create(dto)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (created) => {
          console.log('PROJECT CREATED', created);
          this.toastr.success('L’opération a été effectuée avec succès !', 'Succès');
          this.close();            
          // ferme le wizard
          // option: émettre un event ou router vers /projects/:id
        },
        error: (err) => {
          this.submitError = err?.error?.message || err?.message || 'Création du projet impossible.';
        }
      });
  }


  // === Sélection template (corrigé pour FormGroup imbriqué) ===
  selectTemplate(t: { id: number }) {
    this.selectedTemplateId = t.id;
    this.form.patchValue({ template: { templateId: t.id } });
    this.fTemplateId?.markAsDirty();
    this.fTemplateId?.markAsTouched();
  }

  // === Datepicker : synchronise la date avec le form ===
  setDueDate(d: Date) {
    this.selectedDate = d;
    this.details.get('dueDate')?.setValue(d.toISOString());
    this.details.get('dueDate')?.markAsDirty();
    this.details.get('dueDate')?.markAsTouched();
    this.calendarOpen = false;
  }

  clearDueDate(ev?: Event) {
    ev?.stopPropagation();
    this.selectedDate = null;
    this.details.get('dueDate')?.setValue(null);
    this.details.get('dueDate')?.markAsDirty();
  }

  // --- le reste de ton code (calendar, helpers) inchangé ---
  get daysGrid(): CalendarDay[] {
    const firstOfMonth = new Date(this.viewYear, this.viewMonth, 1);
    const startWeekday = (firstOfMonth.getDay() + 6) % 7;
    const startDate = new Date(this.viewYear, this.viewMonth, 1 - startWeekday);
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return { date, inCurrentMonth: date.getMonth() === this.viewMonth };
    });
  }
  minDate = new Date();

  private startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  isPast(date: Date): boolean {
    return this.startOfDay(date) < this.startOfDay(this.minDate);
  }

  toggleCalendar(): void {
    this.calendarOpen = !this.calendarOpen;
  }
  closeCalendar(): void {
    this.calendarOpen = false;
  }
  prevMonth(): void {
    if (this.viewMonth === 0) {
      this.viewMonth = 11;
      this.viewYear--;
    } else {
      this.viewMonth--;
    }
  }
  nextMonth(): void {
    if (this.viewMonth === 11) {
      this.viewMonth = 0;
      this.viewYear++;
    } else {
      this.viewMonth++;
    }
  }
  selectDate(date: Date): void {
    this.selectedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    this.form.get('details.dueDate')?.setValue(this.selectedDate.toISOString());
    this.closeCalendar();
  }
  onDayClick(date: Date) {
    if (this.isPast(date)) return; // bloque la sélection
    this.selectDate(date); // ta méthode existante
  }
  isToday(d: Date) {
    const t = new Date();
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate()
    );
  }
  isSelected(d: Date) {
    if (!this.selectedDate) return false;
    const s = this.selectedDate;
    return (
      d.getFullYear() === s.getFullYear() &&
      d.getMonth() === s.getMonth() &&
      d.getDate() === s.getDate()
    );
  }
  goToday(): void {
    const t = new Date();
    this.viewYear = t.getFullYear();
    this.viewMonth = t.getMonth();
    this.selectDate(t);
  }

  get progressPercent(): number {
    return (this.step / (this.steps.length - 1)) * 100;
  }

  get filteredMembers() {
    const q = (this.form.get('members.search')?.value || '')
      .toLowerCase()
      .trim();
    if (!q) return this.members;
    return this.members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }

  isSelectedMember(id: number) {
    const ids: number[] = this.form.get('members.userIds')?.value || [];
    return ids.includes(id);
  }
  toggleMember(id: number) {
    const ctrl = this.form.get('members.userIds');
    if (!ctrl) return;
    const current: number[] = ctrl.value || [];
    ctrl.setValue(
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  }
  initials(fullName: string) {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  }
  get selectedMembers() {
    const ids: number[] = this.form.get('members.userIds')?.value || [];
    return this.members.filter((m) => ids.includes(m.id));
  }
}
