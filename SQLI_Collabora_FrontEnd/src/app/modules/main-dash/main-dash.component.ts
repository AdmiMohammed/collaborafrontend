import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ProjectService, ProjectReadDto } from 'src/app/services/project-service/project.service';
import { trigger, transition, style, animate } from '@angular/animations';

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

@Component({
  selector: 'app-main-dash',
  templateUrl: './main-dash.component.html',
  styleUrls: ['./main-dash.component.css'],
  animations: [
    trigger('wizardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ]),
    ]),
  ]
})
export class MainDashComponent implements OnInit {
  projects: ProjectReadDto[] = [];
  isGridView = true;
  openWizard = false;
  Math = Math; 
  // Stats + deltas (pour les mini-cartes et le donut)
  stats: Stats = { total: 0, active: 0, upcoming: 0, overdue: 0, completionRate: 0 };
  prevStats: Stats | undefined;
  deltas: Deltas = { totalPct: 0, activePct: 0, upcomingPct: 0, overduePct: 0 };

  // Sidebar agenda (bloc "nextEvent" sous la carte stats)
  nextEvent: NextEvent | null = null;

  // état de chargement + skeleton
  loading = true;
  skeletonItems = Array.from({ length: 6 });

  constructor(private projectService: ProjectService) {}

  /** Le donut lit directement ce getter (en %) */
  get globalProgress(): number {
    return this.stats.completionRate || 0;
  }

  ngOnInit(): void {
    this.loadProjects();
  }

  private loadProjects(): void {
    this.loading = true;
    this.projectService.getAll()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => {
          this.projects = (data || []).sort((a, b) => a.position - b.position);

          // snapshot avant recalcul (pour les deltas)
          this.prevStats = { ...this.stats };

          // recalculs
          this.computeStats(this.projects);
          this.computeDeltas(this.stats, this.prevStats);
          this.computeNextEvent(this.projects);
        },
        error: (err) => console.error('Erreur chargement projets :', err)
      });
  }

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
      const isOverdue = !!end && end < now && (p.completedTasks || 0) < (p.totalTasks || 0);

      if (isActive) active++;
      if (isUpcoming) upcoming++;
      if (isOverdue) overdue++;

      tasksTotal += p.totalTasks || 0;
      tasksDone += p.completedTasks || 0;
    }

    const completionRate = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
    this.stats = { total, active, upcoming, overdue, completionRate };
  }

  private ratioPct(curr: number, prev: number): number  {
    if (prev === 0 && curr === 0) return 0;
    if (prev === 0) return 100;
    return Math.round(((curr - prev) / prev) * 100);
  }

  private computeDeltas(curr: Stats, prev?: Stats): void {
    if (!prev) {
      this.deltas = { totalPct: 0, activePct: 0, upcomingPct: 0, overduePct: 0 };
      return;
    }
    this.deltas = {
      totalPct:   this.ratioPct(curr.total,   prev.total),
      activePct:  this.ratioPct(curr.active,  prev.active),
      upcomingPct:this.ratioPct(curr.upcoming,prev.upcoming),
      overduePct: this.ratioPct(curr.overdue, prev.overdue),
    };
  }

  /** Renseigne nextEvent avec le projet dont startDate est la plus proche dans le futur */
  private computeNextEvent(list: ProjectReadDto[]): void {
    const now = new Date();
    const upcoming = list
      .filter(p => p.startDate && new Date(p.startDate) > now)
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());

    if (!upcoming.length) {
      this.nextEvent = null;
      return;
    }

    const p = upcoming[0];
    const start = new Date(p.startDate!);
    const end = p.estimatedEndDate ? new Date(p.estimatedEndDate) : null;

    // Libellés lisibles (FR) – adapte si tu veux en anglais
    const dateLabel = start.toLocaleDateString('fr-FR', {
      weekday: 'long', day: '2-digit', month: 'long'
    }); // ex: "dimanche 20 décembre"

    const timeLabel = end
      ? `${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}–${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
      : start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    this.nextEvent = {
      dateLabel,
      timeLabel,
      projectId: p.id,
      title: p.name
    };
  }

  onProjectReorder(updatedProjects: any[]) {
    this.projects = updatedProjects;
    // si l'ordre change, on peut recomputer (optionnel)
    this.computeStats(this.projects);
    this.computeDeltas(this.stats, this.prevStats || this.stats);
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
