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
  stats: Stats = { total: 0, active: 0, upcoming: 0, overdue: 0, completionRate: 0 };
  prevStats: Stats | undefined;
  deltas: Deltas = { totalPct: 0, activePct: 0, upcomingPct: 0, overduePct: 0 };

  // état de chargement + liste fixe pour le skeleton
  loading = true;
  skeletonItems = Array.from({ length: 8 }); // ajuste le nombre si besoin

  constructor(private projectService: ProjectService) {
    this.loadProjects();

  }


  private loadProjects(): void {
    this.loading = true;
    this.projectService.getAll()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => {
          this.projects = data.sort((a, b) => a.position - b.position);
          this.prevStats = { ...this.stats };            // snapshot avant recalcul
          this.computeStats(this.projects);              // calcule les comptes courants
          this.computeDeltas(this.stats, this.prevStats);// calcule les variations %
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

      // En cours = démarré et pas encore dépassé (si end existe)
      const isActive =
        !!start && start <= now && (!end || end >= now);

      // À venir = pas encore démarré
      const isUpcoming = !!start && start > now;

      // En retard = date estimée dépassée ET tout n’est pas terminé
      const isOverdue =
        !!end && end < now && (p.completedTasks || 0) < (p.totalTasks || 0);

      if (isActive) active++;
      if (isUpcoming) upcoming++;
      if (isOverdue) overdue++;

      tasksTotal += p.totalTasks || 0;
      tasksDone += p.completedTasks || 0;
    }
    const completionRate =
      tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;

    this.stats = { total, active, upcoming, overdue, completionRate };
  }


  private ratioPct(curr: number, prev: number): number {
    if (prev === 0 && curr === 0) return 0;     // pas de variation
    if (prev === 0) return 100;                 // convention: +100% quand on passe de 0 à >0
    return Math.round(((curr - prev) / prev) * 100);
  }

  private computeDeltas(curr: Stats, prev: Stats): void {
    if (!prev) { this.deltas = { totalPct: 0, activePct: 0, upcomingPct: 0, overduePct: 0 }; return; }
    this.deltas = {
      totalPct: this.ratioPct(curr.total, prev.total),
      activePct: this.ratioPct(curr.active, prev.active),
      upcomingPct: this.ratioPct(curr.upcoming, prev.upcoming),
      overduePct: this.ratioPct(curr.overdue, prev.overdue),
    };
  }
  ngOnInit(): void {
    this.projectService.getAll()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => {
          this.projects = data.sort((a, b) => a.position - b.position);
          this.computeStats(this.projects);   // <-- important
        },
        error: (err) => {
          console.error('Erreur chargement projets :', err);
        }
      });
  }

  // onProjectReorder(updatedProjects: any[]) {
  //   this.projects = updatedProjects;
  //   console.log('Projets réorganisés :', this.projects);
  // }

  onProjectReorder(event: {
    movedItem: any,
    oldIndex: number,
    newIndex: number,
    fromColumn: any | null,
    toColumn: any | null,
    items?: any[]
  }) {
    if(event.items) this.projects = event.items;
    console.log('Projets réorganisés :', this.projects);
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
