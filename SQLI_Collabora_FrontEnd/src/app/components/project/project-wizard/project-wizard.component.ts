// ==========================
// Imports
// ==========================
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
import { Router } from '@angular/router';
import { User1Service } from 'src/app/services/user-service/user1.service';
import { ProjectService } from 'src/app/services/project-service/project.service';
import { finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { trigger, transition, style, animate } from '@angular/animations';

// ==========================
// Types & interfaces (UI)
// ==========================
type WizardStep = 0 | 1 | 2;

// Modèle UI pour l’affichage
interface TemplateUI {
  id: number;
  name: string;
  desc?: string | null;
  columns: string[];
}

// Modèle interne DRY pour les calendriers
type CalendarModel = {
  open: boolean;
  selected: Date | null;
  viewYear: number;
  viewMonth: number;
};

// ==========================
// Composant
// ==========================
@Component({
  selector: 'app-project-wizard',
  templateUrl: './project-wizard.component.html',
  animations: [
    // Backdrop discret
    trigger('backdropFade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('220ms cubic-bezier(.22,1,.36,1)', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('160ms cubic-bezier(.4,0,.2,1)', style({ opacity: 0 })),
      ]),
    ]),
    // Dialog: slide + fade
    trigger('dialogSlideFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate(
          '240ms cubic-bezier(.22,1,.36,1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '180ms cubic-bezier(.4,0,.2,1)',
          style({ opacity: 0, transform: 'translateY(8px)' })
        ),
      ]),
    ]),
  ],
})
export class ProjectWizardComponent implements OnInit {
  // =====================================================
  // 1) Sorties / état global du wizard
  // =====================================================
  @Output() closed = new EventEmitter<void>();
  isSubmitting = false;
  submitError: string | null = null;

  // Étapes du wizard
  step: WizardStep = 0;
  steps = [
    { key: 'details', label: 'Project Details' },
    { key: 'template', label: 'Template' },
    { key: 'team', label: 'Team' },
  ];

  // =====================================================
  // 2) Formulaire & groupes
  // =====================================================
  form: FormGroup;

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
  get fStart(): AbstractControl | null {
    return this.details.get('startDate');
  }
  get fDue(): AbstractControl | null {
    return this.details.get('dueDate');
  }

  // Messages d’erreur (lisibles côté template)
  get hasTitleError(): boolean {
    return !!(this.fTitle?.touched && this.fTitle?.invalid);
  }
  get titleErrorMsg(): string {
    return 'Le titre est obligatoire.';
  }
  get hasStartError(): boolean {
    return !!(this.fStart?.touched && this.fStart?.invalid);
  }
  get startErrorMsg(): string {
    return 'La date de début est obligatoire.';
  }
  get hasDueError(): boolean {
    return !!(this.fDue?.enabled && this.fDue?.touched && this.fDue?.invalid);
  }
  get hasRangeError(): boolean {
    return !!(this.details.touched && this.details.errors?.['dueBeforeStart']);
  }
  get rangeErrorMsg(): string {
    return 'L’échéance doit être postérieure à la date de début.';
  }

  // =====================================================
  // 3) Données chargées (templates, membres)
  // =====================================================
  templates: TemplateUI[] = [];
  loadingTemplates = false;
  templatesError: string | null = null;

  members: { id: number; name: string; email: string; avatarUrl: string }[] =
    [];

  selectedTemplateId: number | null = null;

  // =====================================================
  // 4) État UI du wizard (calendriers & constantes)
  // =====================================================
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

  // Deux calendriers basés sur un même modèle DRY
  private startCal: CalendarModel = {
    open: false,
    selected: null,
    viewYear: new Date().getFullYear(),
    viewMonth: new Date().getMonth(),
  };
  private dueCal: CalendarModel = {
    open: false,
    selected: null,
    viewYear: new Date().getFullYear(),
    viewMonth: new Date().getMonth(),
  };

  // Proxies (conservent l’API publique attendue par le template)
  get calendarStartOpen() {
    return this.startCal.open;
  }
  set calendarStartOpen(v: boolean) {
    this.startCal.open = v;
  }
  get selectedStartDate() {
    return this.startCal.selected;
  }
  set selectedStartDate(v: Date | null) {
    this.startCal.selected = v;
  }
  get viewYearStart() {
    return this.startCal.viewYear;
  }
  set viewYearStart(v: number) {
    this.startCal.viewYear = v;
  }
  get viewMonthStart() {
    return this.startCal.viewMonth;
  }
  set viewMonthStart(v: number) {
    this.startCal.viewMonth = v;
  }
  get calendarDueOpen() {
    return this.dueCal.open;
  }
  set calendarDueOpen(v: boolean) {
    this.dueCal.open = v;
  }
  get selectedDueDate() {
    return this.dueCal.selected;
  }
  set selectedDueDate(v: Date | null) {
    this.dueCal.selected = v;
  }
  get viewYearDue() {
    return this.dueCal.viewYear;
  }
  set viewYearDue(v: number) {
    this.dueCal.viewYear = v;
  }
  get viewMonthDue() {
    return this.dueCal.viewMonth;
  }
  set viewMonthDue(v: number) {
    this.dueCal.viewMonth = v;
  }

  // =====================================================
  // 5) Construction & DI
  // =====================================================
  constructor(
    private fb: FormBuilder,
    private templatesSvc: TemplatesService,
    private user1Service: User1Service,
    private projectService: ProjectService,
    private toastr: ToastrService,
    private router: Router
  ) {
    // -- Structure du formulaire
    this.form = this.fb.group({
      details: this.fb.group(
        {
          title: ['', Validators.required],
          description: [''],
          startDate: [null, Validators.required],
          dueDate: [null],
        },
        { validators: [this.dueAfterStartValidator()] }
      ),
      template: this.fb.group({
        templateId: [null, Validators.required],
      }),
      members: this.fb.group({
        userIds: [[]],
        search: [''],
      }),
    });

    // -- Règle: dueDate inactif tant que startDate n’est pas fixé
    this.fDue?.clearValidators();
    this.fDue?.disable({ emitEvent: false });
    this.fDue?.updateValueAndValidity({ emitEvent: false });
  }

  // =====================================================
  // 6) Lifecycle
  // =====================================================
  ngOnInit(): void {
    this.loadTemplates();
    this.loadMembers();

    // Activer/désactiver dueDate selon la présence de startDate
    this.fStart?.valueChanges.subscribe((iso: string | null) => {
      const dueCtrl = this.fDue!;
      if (iso) {
        dueCtrl.enable({ emitEvent: false });
      } else {
        // reset + disable
        this.selectedDueDate = null;
        dueCtrl.reset(null, { emitEvent: false });
        dueCtrl.disable({ emitEvent: false });
        this.calendarDueOpen = false;
      }
    });
  }

  // =====================================================
  // 7) Chargements API (templates / membres)
  // =====================================================
  private loadMembers() {
    this.user1Service.getOtherUsers().subscribe((users) => {
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

  // =====================================================
  // 8) Validation (groupe details)
  // =====================================================
  private dueAfterStartValidator() {
    return (group: AbstractControl) => {
      const startIso = group.get('startDate')?.value as string | null;
      const dueIso = group.get('dueDate')?.value as string | null;
      if (!startIso || !dueIso) return null;
      const s = new Date(startIso);
      const d = new Date(dueIso);
      return d >= this.startOfDay(s) ? null : { dueBeforeStart: true };
    };
  }

  // =====================================================
  // 9) Navigation du wizard (avec validation d’étape)
  // =====================================================
  next(): void {
    if (this.step === 0 && this.details.invalid) {
      this.details.markAllAsTouched();
      return;
    }
    if (this.step === 1 && this.template.invalid) {
      this.template.markAllAsTouched();
      return;
    }
    if (this.step < 2) this.step = (this.step + 1) as WizardStep;
  }

  back(): void {
    if (this.step > 0) this.step = (this.step - 1) as WizardStep;
  }

  close(): void {
    this.closed.emit();
  }

  // =====================================================
  // 10) Soumission
  // =====================================================
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
    const tpl = this.templates.find((t) => t.id === templateId);
    const initialBoardCount = tpl?.columns?.length ?? 0;

    const dto = {
      name: v.details.title,
      description: v.details.description,
      startDate: v.details.startDate || null,
      estimatedEndDate: v.details.dueDate || null,
      templateId,
      initialBoardCount,
      memberIds: v.members.userIds || [],
    } as const;

    this.isSubmitting = true;
    this.projectService
      .create(dto)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (created) => {
          this.toastr.success(
            'L’opération a été effectuée avec succès !',
            'Succès'
          );
          this.close();
          return this.router.navigate(['/projects', created.id]);
        },
        error: (err) => {
          this.submitError =
            err?.error?.message ||
            err?.message ||
            'Création du projet impossible.';
        },
      });
  }

  // =====================================================
  // 11) Sélection du template
  // =====================================================
  selectTemplate(t: { id: number }) {
    this.selectedTemplateId = t.id;
    this.form.patchValue({ template: { templateId: t.id } });
    this.touch(this.fTemplateId);
  }

  // =====================================================
  // 12) Helpers communs
  // =====================================================
  private toUtcMidnightISOString(d: Date): string {
    // Crée la date 00:00:00Z du jour sélectionné
    const z = new Date(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
    );
    return z.toISOString();
  }

  private touch(ctrl: AbstractControl | null) {
    ctrl?.markAsDirty();
    ctrl?.markAsTouched();
    ctrl?.updateValueAndValidity({ emitEvent: false });
  }

  minDate = new Date();

  private startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  isPast(date: Date): boolean {
    // Pour START: bloque le passé (aujourd’hui OK)
    return this.startOfDay(date) < this.startOfDay(this.minDate);
  }

  isBeforeStart(date: Date): boolean {
    // Pour DUE: bloque < start
    if (!this.selectedStartDate) return true; // bloque tout si pas de start
    return this.startOfDay(date) < this.selectedStartDate;
  }

  isToday(d: Date) {
    const t = new Date();
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate()
    );
  }

  // =====================================================
  // 13) Datepicker START (via modèle générique)
  // =====================================================
  toggleCalendarStart() {
    this.calendarStartOpen = !this.calendarStartOpen;
  }
  closeCalendarStart() {
    this.calendarStartOpen = false;
  }
  prevMonthStart() {
    this.shiftMonth(this.startCal, -1);
  }
  nextMonthStart() {
    this.shiftMonth(this.startCal, +1);
  }
  get daysGridStart() {
    return this.buildDaysGrid(this.viewYearStart, this.viewMonthStart);
  }
  setStartDate(d: Date) {
    this.selectedStartDate = this.startOfDay(d);
    this.fStart?.setValue(this.toUtcMidnightISOString(d));
    this.touch(this.fStart);

    if (
      this.selectedDueDate &&
      this.startOfDay(this.selectedDueDate) < this.selectedStartDate
    ) {
      this.clearDueDate();
    }
    this.fDue?.enable({ emitEvent: false });
    this.fDue?.setValidators([Validators.required]);
    this.fDue?.updateValueAndValidity({ emitEvent: false });

    this.calendarStartOpen = false;
  }
  clearStartDate(ev?: Event) {
    ev?.stopPropagation();
    this.selectedStartDate = null;
    this.fStart?.setValue(null);
    this.touch(this.fStart);

    // règle: si on supprime start → on supprime et bloque due
    this.clearDueDate();
    this.fDue?.clearValidators();
    this.fDue?.disable({ emitEvent: false });
    this.fDue?.updateValueAndValidity({ emitEvent: false });
  }
  isStartSelected(d: Date) {
    return this.sameDay(this.selectedStartDate, d);
  }
  goTodayStart() {
    const t = new Date();
    this.viewYearStart = t.getFullYear();
    this.viewMonthStart = t.getMonth();
    if (!this.isPast(t)) this.setStartDate(t);
  }

  // =====================================================
  // 14) Datepicker DUE (via modèle générique)
  // =====================================================
  toggleCalendarDue() {
    if (this.selectedStartDate) this.calendarDueOpen = !this.calendarDueOpen;
  }
  closeCalendarDue() {
    this.calendarDueOpen = false;
  }
  prevMonthDue() {
    this.shiftMonth(this.dueCal, -1);
  }
  nextMonthDue() {
    this.shiftMonth(this.dueCal, +1);
  }
  get daysGridDue() {
    return this.buildDaysGrid(this.viewYearDue, this.viewMonthDue);
  }
  setDueDate(d: Date) {
    if (this.isBeforeStart(d)) return;

    this.selectedDueDate = this.startOfDay(d);
    this.fDue?.setValue(this.toUtcMidnightISOString(d));
    this.touch(this.fDue);

    this.calendarDueOpen = false;
  }
  clearDueDate(ev?: Event) {
    ev?.stopPropagation();
    this.selectedDueDate = null;
    this.fDue?.setValue(null);
    this.touch(this.fDue);
  }
  isDueSelected(d: Date) {
    return this.sameDay(this.selectedDueDate, d);
  }
  goTodayDue() {
    const t = new Date();
    this.viewYearDue = t.getFullYear();
    this.viewMonthDue = t.getMonth();
    if (!this.isBeforeStart(t)) this.setDueDate(t);
  }

  // =====================================================
  // 15) Getters UI auxiliaires
  // =====================================================
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

  get selectedMembers() {
    const ids: number[] = this.form.get('members.userIds')?.value || [];
    return this.members.filter((m) => ids.includes(m.id));
  }

  // =====================================================
  // 16) Sélection membres (helpers)
  // =====================================================
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

  // =====================================================
  // 17) Helpers calendrier DRY (communs aux 2)
  // =====================================================
  private buildDaysGrid(y: number, m: number) {
    const firstOfMonth = new Date(y, m, 1);
    const startWeekday = (firstOfMonth.getDay() + 6) % 7; // semaine Lundi
    const startDate = new Date(y, m, 1 - startWeekday);
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return { date, inCurrentMonth: date.getMonth() === m };
    });
  }

  private shiftMonth(cal: CalendarModel, dir: 1 | -1) {
    if (dir === 1 && cal.viewMonth === 11) {
      cal.viewMonth = 0;
      cal.viewYear++;
    } else if (dir === -1 && cal.viewMonth === 0) {
      cal.viewMonth = 11;
      cal.viewYear--;
    } else {
      cal.viewMonth += dir;
    }
  }

  private sameDay(a: Date | null, b: Date) {
    if (!a) return false;
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}
