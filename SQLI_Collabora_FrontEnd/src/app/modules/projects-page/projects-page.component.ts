// ==========================
// Imports
// ==========================
import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ProjectReadDto, ProjectTaskReadDto } from 'src/app/models/project';
import { ProjectService } from 'src/app/services/project-service/project.service';

// ==========================
// Types & alias (métier UI)
// ==========================
type Stats = {
  total: number;
  active: number;
  upcoming: number;
  overdue: number;
  completionRate: number; // %
};

type Deltas = {
  totalPct: number;
  activePct: number;
  upcomingPct: number;
  overduePct: number;
};

type NextEvent = {
  dateLabel: string;
  timeLabel: string;
  projectId?: number;
  title?: string;
};

// --- Filtre mini-dashboard
type ProjectFilter = 'ALL' | 'ACTIVE' | 'UPCOMING' | 'OVERDUE';

// ==========================
// Composant
// ==========================
@Component({
  selector: 'app-projects-page',
  templateUrl: './projects-page.component.html',
  styleUrls: ['./projects-page.component.css'],
})
export class ProjectsPageComponent implements OnInit {
  // =====================================================
  // 1) État d’UI & données brutes (lisibles dans le template)
  // =====================================================
  isSidebarOpen = false;
  todayLabel = '';

  projects: ProjectReadDto[] = [];
  isGridView = true;
  openWizard = false;

  // Exposition de Math pour le template
  Math = Math;

  // Chargement / skeletons
  loading = true;
  skeletonItems = Array.from({ length: 6 });

  // Urgent
  urgentTasks: ProjectTaskReadDto[] = [];
  urgentCount = 0;
  urgentSubtitle = '';
  loadingUrgent = false;
  urgentProjectIds = new Set<number>();

  // Stats + deltas
  stats: Stats = {
    total: 0,
    active: 0,
    upcoming: 0,
    overdue: 0,
    completionRate: 0,
  };
  prevStats: Stats | undefined;
  deltas: Deltas = { totalPct: 0, activePct: 0, upcomingPct: 0, overduePct: 0 };

  // Agenda (sidebar)
  nextEvent: NextEvent | null = null;

  // Filtre mini-dashboard
  selectedFilter: ProjectFilter = 'ALL';

  // ==========================
  // 2) Services (DI)
  // ==========================
  constructor(private projectService: ProjectService) {}

  // =====================================================
  // 3) Lifecycle (initialisation)
  // =====================================================
  ngOnInit(): void {
    // Date du jour (locale MA + timezone Casablanca)
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('fr-MA', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Africa/Casablanca',
    });
    this.todayLabel = fmt.format(now);

    // Chargements initiaux
    this.loadProjects();
    this.loadUrgentTasks();
  }

  // (Optionnel) Rejouer l’animation donut si la progression change
  ngOnChanges() {
    requestAnimationFrame(() => {
      const donuts = document.querySelectorAll(
        '[style*="--offset"] circle[style*="ring-fill"]'
      );
      donuts.forEach((el) => {
        (el as HTMLElement).style.animation = 'none';
        // force reflow
        // @ts-ignore
        void (el as HTMLElement).offsetWidth;
        (el as HTMLElement).style.animation = '';
      });
    });
  }

  // =====================================================
  // 4) Chargement des données (API)
  // =====================================================
  private loadUrgentTasks(): void {
    this.loadingUrgent = true;

    // Sentinel .NET pour "date non définie"
    const MIN_DATE_SENTINEL = '0001-01-01T00:00:00';
    const isNotCompleted = (s?: string | null) =>
      !s || s === MIN_DATE_SENTINEL || s.startsWith('0001-01-01');

    this.projectService
      .getMyAssignedTasksByDeadline()
      .pipe(finalize(() => (this.loadingUrgent = false)))
      .subscribe({
        next: (tasks) => {
          const now = new Date();
          const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

          this.urgentTasks = (tasks || []).filter((t) => {
            // 1) Exclure les tâches déjà terminées
            if (!isNotCompleted(t.completedAt)) return false;

            // 2) Deadline dans les 3 prochains jours
            if (!t.deadline) return false;
            const d = new Date(t.deadline);
            return d > now && d <= in3Days;
          });

          this.urgentProjectIds = new Set(
            this.urgentTasks
              .map((t) => t.projectId)
              .filter((id): id is number => !!id)
          );

          this.urgentCount = this.urgentTasks.length;
          this.urgentSubtitle =
            this.urgentCount === 0
              ? 'Aucune tâche urgente'
              : this.urgentCount === 1
              ? '1 à traiter sous 3 jours'
              : `${this.urgentCount} à traiter sous 3 jours`;
        },
        error: (err) => {
          console.error('Erreur chargement tâches urgentes :', err);
          this.urgentSubtitle = 'Impossible de charger les tâches';
        },
      });
  }

  private loadProjects(): void {
    this.loading = true;
    this.projectService
      .getAll()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => {
          this.projects = (data || []).sort((a, b) => a.position - b.position);

          // Snapshot avant recalcul (pour deltas)
          this.prevStats = { ...this.stats };

          // Recalculs
          this.computeStats(this.projects);
          this.computeDeltas(this.stats, this.prevStats);
          this.computeNextEvent(this.projects);
        },
        error: (err) => console.error('Erreur chargement projets :', err),
      });
  }

  // =====================================================
  // 5) Calculs (KPIs, deltas, agenda)
  // =====================================================
  private computeStats(list: ProjectReadDto[]): void {
    const now = new Date();
    const toDate = (s?: string | null) => (s ? new Date(s) : null);

    let total = list.length;
    let active = 0;
    let upcoming = 0;
    let overdue = 0;
    let tasksTotal = 0;
    let tasksDone = 0;

    for (const p of list) {
      const start = toDate(p.startDate);
      const end = toDate(p.estimatedEndDate);

      const isActive = !!start && start <= now && (!end || end >= now);
      const isUpcoming = !!start && start > now;
      const isOverdue =
        !!end &&
        end < now &&
        (p.completedRealTasks || 0) < (p.totalRealTasks || 0);

      if (isActive) active++;
      if (isUpcoming) upcoming++;
      if (isOverdue) overdue++;

      tasksTotal += p.totalRealTasks || 0;
      tasksDone += p.completedRealTasks || 0;
    }

    const completionRate =
      tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
    this.stats = { total, active, upcoming, overdue, completionRate };
  }

  private ratioPct(curr: number, prev: number): number {
    if (prev === 0 && curr === 0) return 0;
    if (prev === 0) return 100;
    return Math.round(((curr - prev) / prev) * 100);
  }

  private computeDeltas(curr: Stats, prev?: Stats): void {
    if (!prev) {
      this.deltas = {
        totalPct: 0,
        activePct: 0,
        upcomingPct: 0,
        overduePct: 0,
      };
      return;
    }
    this.deltas = {
      totalPct: this.ratioPct(curr.total, prev.total),
      activePct: this.ratioPct(curr.active, prev.active),
      upcomingPct: this.ratioPct(curr.upcoming, prev.upcoming),
      overduePct: this.ratioPct(curr.overdue, prev.overdue),
    };
  }

  /** Renseigne l’événement à venir (startDate la plus proche dans le futur) */
  private computeNextEvent(list: ProjectReadDto[]): void {
    const now = new Date();
    const upcoming = list
      .filter((p) => p.startDate && new Date(p.startDate) > now)
      .sort(
        (a, b) =>
          new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime()
      );

    if (!upcoming.length) {
      this.nextEvent = null;
      return;
    }

    const p = upcoming[0];
    const start = new Date(p.startDate!);
    const end = p.estimatedEndDate ? new Date(p.estimatedEndDate) : null;

    const dateLabel = start.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });

    const timeLabel = end
      ? `${start.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })}–${end.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      : start.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        });

    this.nextEvent = { dateLabel, timeLabel, projectId: p.id, title: p.name };
  }

  // =====================================================
  // 6) Filtres utilitaires (getters + helpers pour le template)
  // =====================================================

  /** Le donut lit directement ce getter (en %) */
  get globalProgress(): number {
    return this.stats.completionRate || 0;
  }

  /** Liste filtrée selon le mini-filtre actif */
  get filteredProjects(): ProjectReadDto[] {
    if (this.selectedFilter === 'ALL') return this.projects;

    const now = new Date();
    const toDate = (s?: string | null) => (s ? new Date(s) : null);

    return this.projects.filter((p) => {
      const start = toDate(p.startDate);
      const end = toDate(p.estimatedEndDate);
      const done = (p.completedRealTasks || 0) >= (p.totalRealTasks || 0);

      const isActive = !!start && start <= now && (!end || end >= now);
      const isUpcoming = !!start && start > now;
      const isOverdue = !!end && end < now && !done;

      switch (this.selectedFilter) {
        case 'ACTIVE':
          return isActive;
        case 'UPCOMING':
          return isUpcoming;
        case 'OVERDUE':
          return isOverdue;
        default:
          return true;
      }
    });
  }

  // Helpers de gestion du filtre (UI)
  setFilter(f: ProjectFilter) {
    this.selectedFilter = f;
  }
  isFilterActive(f: ProjectFilter) {
    return this.selectedFilter === f;
  }
  clearFilter() {
    this.selectedFilter = 'ALL';
  }

  // =====================================================
  // 7) Handlers UI (interactions utilisateur)
  // =====================================================
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
onProjectReorder(updated: ProjectReadDto[]) {
  const list = (updated ?? []).map((p, i) => ({ ...p, position: i }));
  this.projects = list;
  // Si tu veux aussi re-trier l’affichage filtré, ça se fera via le getter.
  this.prevStats = { ...this.stats };
  this.computeStats(this.projects);
  this.computeDeltas(this.stats, this.prevStats);
  this.computeNextEvent(this.projects);
}


  openNewProjectWizard() {
    this.openWizard = true;
    document.body.style.overflow = 'hidden';
  }

  handleWizardClose() {
    this.openWizard = false;
    document.body.style.overflow = '';
  }

  trackByIndex = (_: number, i: any) => i;
}
