// ==========================
// Imports Angular
// ==========================
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnInit,
} from '@angular/core';

// ==========================
// Imports Chart.js
// ==========================
import Chart, {
  type ChartData,
  type ChartOptions,
  type Plugin,
  type ScriptableContext,
  ChartType,
} from 'chart.js/auto';

// ==========================
// Imports internes (app/services + composants)
// ==========================
import { FilterOption } from '../filter-select/filter-select.component';
import {
  TaskDashboardResponse,
  TasksDashboardService,
} from 'src/app/services/dashboard-service/tasks-dashboard.service';

// ==========================
// Types & interfaces (domaine UI)
// ==========================
type KpiIcon = 'active' | 'done' | 'avg' | 'late' | 'due7' | 'all';
interface KpiItem {
  label: string;
  value: number | string;
  suffix?: string;
  icon: KpiIcon;
}

export type Priority = 'High' | 'Medium' | 'Low';
export type Status = 'ToDo' | 'InProgress' | 'Review' | 'Blocked' | 'Done';

interface TaskRow {
  id: number;
  title: string;
  board: string;
  status: Status;
  priority: Priority;
  deadline?: Date | null;
  createdAt: Date;
  completedAt: Date | null;
  comments: number;
  attachments: number;
  project: string;
}

interface Project {
  name: string;
  priorities: Record<Priority, number>;
}

interface DoneEvent {
  project: string; // toujours "ALL" pour l’instant
  date: Date;
  count: number;
}

// ==========================
// Composant
// ==========================
@Component({
  selector: 'app-tasks-dashboard',
  templateUrl: './tasks-dashboard.component.html',
})
export class TasksDashboardComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  // =====================================================
  // 1) Filtres & sélections (ce que l’utilisateur choisit)
  // =====================================================
  selectedRangeArea: string | string[] | null = '4w';
  selectedProjectForArea: string | string[] | null = 'ALL';
  selectedRange: '4w' | '12w' | '6m' | '1y' = '4w';
  selectedProject: string | string[] | null = 'ALL';

  // Valeurs bindées aux <select> (2-way binding)
  statusSelectValue: string | string[] | null = 'ALL';
  prioritySelectValue: string | string[] | null = 'ALL';
  tableProjectValue: string | string[] | null = 'ALL';

  // ==========================
  // Labels (FR) pour l’UI
  // ==========================
  readonly statusLabels: Record<Status, string> = {
    ToDo: 'À faire',
    InProgress: 'En cours',
    Review: 'En révision',
    Blocked: 'Bloquée',
    Done: 'Terminée',
  };

  readonly priorityLabels: Record<Priority, string> = {
    High: 'Haute',
    Medium: 'Moyenne',
    Low: 'Basse',
  };

  // ==========================
  // Options de filtres (listes déroulantes)
  // ==========================
  readonly filterOptions = {
    range: [
      { value: '4w', label: '4 sem.' },
      { value: '12w', label: '12 sem.' },
      { value: '6m', label: '6 mois' },
      { value: '1y', label: '1 an' },
    ] as FilterOption[],
    status: [
      { value: 'ALL', label: 'Tous' },
      { value: 'ToDo', label: 'À faire' },
      { value: 'InProgress', label: 'En cours' },
      { value: 'Review', label: 'En révision' },
      { value: 'Blocked', label: 'Bloquée' },
      { value: 'Done', label: 'Terminée' },
    ] as FilterOption[],
    priority: [
      { value: 'ALL', label: 'Toutes' },
      { value: 'High', label: 'Haute' },
      { value: 'Medium', label: 'Moyenne' },
      { value: 'Low', label: 'Basse' },
    ] as FilterOption[],
    projects: [] as FilterOption[],
  };

  // ==========================
  // Services (DI)
  // ==========================
  constructor(private tasksDashboardService: TasksDashboardService) {}

  // ==========================
  // Données KPI + Projets
  // ==========================
  kpis: KpiItem[] = [];
  projects: Project[] = [];
  projectNames = this.projects.map((p) => p.name);

  // ==========================
  // Thème & couleurs
  // ==========================
  readonly colors = {
    text: '#16306B',
    background: '#F4F6FE',
    grid: 'rgba(22,48,107,0.06)',

    // Priorités réordonnées logiquement
    high: '#FC0FC0', // couleur intense
    medium: '#C020D0', // intermédiaire
    low: '#8432DF', // plus douce

    // Variantes remplies
    highFill: 'rgba(252, 15, 192, 0.70)',
    mediumFill: 'rgba(192, 32, 208, 0.75)',
    lowFill: 'rgba(132, 50, 223, 0.75)',

    // Variantes hover
    highHover: 'rgba(252, 15, 192, 0.88)',
    mediumHover: 'rgba(192, 32, 208, 0.92)',
    lowHover: 'rgba(132, 50, 223, 0.92)',
  } as const;

  // Couleur des médaillons KPI
  iconBg: Record<KpiIcon, string> = {
    all: 'bg-primary-mid/10 text-primary-mid',
    active: 'bg-blue-100 text-blue-600',
    done: 'bg-emerald-100 text-emerald-600',
    due7: 'bg-amber-100 text-amber-600',
    late: 'bg-rose-100 text-rose-600',
    avg: 'bg-indigo-100 text-indigo-600',
  };

  // =====================================================
  // 2) Cycle de vie Angular (chargement + destruction)
  // =====================================================
  ngOnInit(): void {
    this.tasksDashboardService.getTasksDashboard().subscribe((resp) => {
      this.mapApiResponse(resp);
    });
  }

  private mapApiResponse(resp: TaskDashboardResponse): void {
    const tasks = resp.userTasks;

    // 1. Recalcul KPI
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Done').length;
    const active = tasks.filter((t) =>
      ['ToDo', 'InProgress', 'Review'].includes(t.status)
    ).length;
    const blocked = tasks.filter((t) => t.status === 'Blocked').length;
    const overdue = tasks.filter(
      (t) => t.deadline && !t.completedAt && new Date(t.deadline) < new Date()
    ).length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    this.kpis = [
      { label: 'Total des tâches assignées', value: total, icon: 'all' },
      { label: 'Tâches actives', value: active, icon: 'active' },
      { label: 'Terminées', value: completed, icon: 'done' },
      { label: 'En retard', value: overdue, icon: 'late' },
      { label: 'Bloquées', value: blocked, icon: 'due7' },
      {
        label: 'Taux de complétion',
        value: completionRate.toFixed(2) + '%',
        icon: 'avg',
      },
    ];

    // 2. Bar chart (par projet, hors Done)
    const activeTasks = tasks.filter((t) => t.status !== 'Done');
    const projectBars = activeTasks.reduce((acc, t) => {
      if (!acc[t.project]) acc[t.project] = { High: 0, Medium: 0, Low: 0 };
      if (t.priority) acc[t.project][t.priority as Priority]++;
      return acc;
    }, {} as Record<string, Record<Priority, number>>);

    this.projects = Object.entries(projectBars).map(([name, priorities]) => ({
      name,
      priorities,
    }));
    this.projectNames = this.projects.map((p) => p.name);

    this.barData = {
      labels: this.projects.map((p) => p.name),
      datasets: [
        {
          label: 'Haute',
          data: this.projects.map((p) => p.priorities.High),
          backgroundColor: this.colors.highFill,
          hoverBackgroundColor: this.colors.highHover,
          borderColor: this.colors.high,
          borderWidth: 1,
          borderRadius: 8,
          maxBarThickness: 18,
          categoryPercentage: 0.66,
          barPercentage: 0.82,
        },
        {
          label: 'Moyenne',
          data: this.projects.map((p) => p.priorities.Medium),
          backgroundColor: this.colors.mediumFill,
          hoverBackgroundColor: this.colors.mediumHover,
          borderColor: this.colors.medium,
          borderWidth: 1,
          borderRadius: 8,
          maxBarThickness: 18,
          categoryPercentage: 0.66,
          barPercentage: 0.82,
        },
        {
          label: 'Basse',
          data: this.projects.map((p) => p.priorities.Low),
          backgroundColor: this.colors.lowFill,
          hoverBackgroundColor: this.colors.lowHover,
          borderColor: this.colors.low,
          borderWidth: 1,
          borderRadius: 8,
          maxBarThickness: 18,
          categoryPercentage: 0.66,
          barPercentage: 0.82,
        },
      ],
    };

    // 3. Donut chart (répartition statuts)
    const counts: Record<Status, number> = {
      ToDo: 0,
      InProgress: 0,
      Review: 0,
      Blocked: 0,
      Done: 0,
    };
    tasks.forEach((t) => {
      counts[t.status as Status]++;
    });
    this.counts = counts;

    // 4. Area chart (tendance des Done)
    this.doneLog = tasks
      .filter((t) => t.status === 'Done' && t.completedAt)
      .map((t) => ({
        project: t.project,
        date: new Date(t.completedAt!),
        count: 1,
      }));
    this.applyAreaFilter();

    // 5. Table (liste des tâches)
    this.tasks = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      board: t.board,
      status: t.status as Status,
      priority: t.priority as Priority,
      createdAt: new Date(t.createdAt),
      completedAt: t.completedAt ? new Date(t.completedAt) : null,
      deadline: t.deadline ? new Date(t.deadline) : null,
      comments: t.comments,
      attachments: t.attachments,
      project: t.project,
    }));
    this.applyTableFilters();

    // 6. Filtres projet (select)
    const names = Array.from(new Set(this.tasks.map((t) => t.project)));
    this.filterOptions.projects = [
      { value: 'ALL', label: 'Tous' },
      ...names.map((p) => ({ value: p, label: p })),
    ];

    this.updateDonutData('ALL');
    this.renderBar();
  }

  ngAfterViewInit(): void {
    // Au montage : on dessine tout
    this.renderBar();
    this.renderArea();
    this.renderDonut();
    this.applyAreaFilter();
  }

  ngOnDestroy(): void {
    // Nettoyage propre des instances Chart.js
    this.barChart?.destroy();
    this.areaChart?.destroy();
    this.donutChart?.destroy();
  }

  // =====================================================
  // 3) Helpers (normalisation + gestion des filtres)
  // =====================================================
  private normalizeSingle(
    v: string | string[] | null,
    fallback: string
  ): string {
    return Array.isArray(v) ? v[0] ?? fallback : v ?? fallback;
  }

  /** Handler générique des <select> */
  onSelectChange(
    type:
      | 'status'
      | 'priority'
      | 'project'
      | 'donut'
      | 'areaProject'
      | 'areaRange'
      | 'tableProject'
      | 'donutProject'
      | 'deadlineQuick',
    v: string | string[] | null
  ): void {
    const val = this.normalizeSingle(v, 'ALL');
    switch (type) {
      case 'status':
        this.statusFilter = val as 'ALL' | Status;
        break;
      case 'priority':
        this.priorityFilter = val as 'ALL' | Priority;
        break;
      case 'project':
      case 'tableProject': 
        this.projectFilter = val;
        this.tableProjectValue = val;
        break;
      case 'donut':
      case 'donutProject': 
        this.selectedProject = val;
        this.updateDonutData(val);
        break;
      case 'areaProject':
        this.selectedProjectForArea = val;
        this.applyAreaFilter();
        break;
      case 'areaRange':
        this.selectedRangeArea = val;
        this.applyAreaFilter();
        break;
      case 'deadlineQuick':
        this.deadlineQuick = val as 'all' | 'overdue' | 'dueSoon';
        break;
    }
    this.applyTableFilters();
  }

  // =====================================================
  // 4) CHARTS (Bar + Donut + Area) — regroupés ici
  // =====================================================

  // ---- Références canvas & instances Chart.js ----
  @ViewChild('barCanvas', { static: true })
  private barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('areaCanvas', { static: true })
  private areaCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutCanvas', { static: true })
  private donutCanvas!: ElementRef<HTMLCanvasElement>;

  private barChart?: Chart<'bar'>;
  private areaChart?: Chart<'line'>;
  private donutChart?: Chart<'doughnut'>;

  // ---- Utilitaire commun pour créer un chart ----
  private createChart<T extends ChartType>(
    ref: ElementRef<HTMLCanvasElement>,
    type: T,
    data: ChartData<T>,
    options: ChartOptions<T>,
    plugins: Plugin<T>[] = []
  ): Chart<T> {
    return new Chart<T>(ref.nativeElement, { type, data, options, plugins });
  }

  // -------------------------
  // BAR chart (config + data)
  // -------------------------
  barData: ChartData<'bar'> = { labels: [], datasets: [] };

  readonly barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeOutQuart' },
    scales: {
      x: {
        grid: {
          color: this.colors.grid, // fin, discret
          lineWidth: 0.6,
          drawTicks: false,
        },
        border: { display: false },
        ticks: {
          color: '#4b5563', // gris doux
          font: { size: 11, weight: '500' },
          padding: 6,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: this.colors.grid,
          lineWidth: 0.6,
        },
        border: { display: false },
        ticks: {
          color: '#6b7280',
          font: { size: 11 },
          precision: 0,
          padding: 6,
        },
      },
    },
    plugins: {
      legend: {
        display: false, // masque complètement la légende
      },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        titleColor: '#111827',
        bodyColor: '#111827',
        borderColor: 'rgba(0,0,0,0.08)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
        mode: 'index',
        intersect: false,
      },
    },
    elements: {
      bar: {
        borderRadius: 8,
        borderSkipped: false,
      },
    },
  };

  private renderBar(): void {
    this.barChart?.destroy();
    this.barChart = this.createChart(
      this.barCanvas,
      'bar',
      this.barData,
      this.barOptions
    );
  }

  // ---------------------------
  // DONUT chart (config + data)
  // ---------------------------
  readonly colorsDonut = {
    todoFill: 'rgba(192, 32, 208, 0.75)',   // violet moyen (À faire)
    todoBorder: '#C020D0',

    inProgFill: 'rgba(132, 50, 223, 0.75)', // indigo doux (En cours)
    inProgBorder: '#8432DF',

    reviewFill: '#38BDF8',                  // bleu clair (En révision)
    reviewBorder: '#0EA5E9',

    blockedFill: '#FBBF24',                 // jaune (bloquée / en retard)
    blockedBorder: '#F59E0B',

    doneFill: '#34D399',                    // vert menthe (terminée)
    doneBorder: '#10B981',

    text: '#334155', // gris ardoise
  } as const;

  counts: Record<Status, number> = {
    ToDo: 0,
    InProgress: 0,
    Review: 0,
    Blocked: 0,
    Done: 0,
  };

  doughnutData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  readonly doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const total = this.totalTasks || 1;
            const value = (ctx.parsed as number) ?? 0;
            const pct = Math.round((value / total) * 100);
            return `${ctx.label}: ${value} (${pct}%)`;
          },
        },
      },
    },
  };

  readonly centerTextPlugin: Plugin<'doughnut'> = {
    id: 'centerText',
    beforeDraw: (chart) => {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const ds = chart.data.datasets[0];
      const values = (ds?.data as number[]) ?? [];
      const total = values.reduce((a, b) => a + b, 0);
      const cx = (chartArea.left + chartArea.right) / 2;
      const cy = (chartArea.top + chartArea.bottom) / 2;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = this.colorsDonut.text;
      ctx.font = '600 12px Inter, system-ui, sans-serif';
      ctx.fillText('Total', cx, cy - 4);
      ctx.font = '700 18px Inter, system-ui, sans-serif';
      ctx.fillText(String(total), cx, cy + 16);
      ctx.restore();
    },
  };

  get totalTasks(): number {
    return Object.values(this.counts).reduce((a, b) => a + b, 0);
  }

  updateDonutData(project: 'ALL' | string): void {
    // 1) Filtrer par projet (ou ALL)
    const filteredTasks = this.tasks.filter(
      (t) => project === 'ALL' || t.project === project
    );

    // 2) Compter par statut
    const counts: Record<Status, number> = {
      ToDo: 0,
      InProgress: 0,
      Review: 0,
      Blocked: 0,
      Done: 0,
    };
    filteredTasks.forEach((t) => {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    });

    // 3) Construire les données pour Chart.js
    this.doughnutData = {
      labels: Object.keys(counts).map((k) => this.statusLabels[k as Status]),
      datasets: [
        {
          data: Object.values(counts),
          backgroundColor: [
            this.colorsDonut.todoFill,
            this.colorsDonut.inProgFill,
            this.colorsDonut.reviewFill,
            this.colorsDonut.blockedFill,
            this.colorsDonut.doneFill,
          ],
          borderColor: [
            this.colorsDonut.todoBorder,
            this.colorsDonut.inProgBorder,
            this.colorsDonut.reviewBorder,
            this.colorsDonut.blockedBorder,
            this.colorsDonut.doneBorder,
          ],
          borderWidth: 1,
          hoverOffset: 6,
          spacing: 2,
        },
      ],
    };

    // 4) Redessiner si déjà monté
    if (this.donutChart) this.renderDonut();
  }

  private renderDonut(): void {
    this.donutChart?.destroy();
    this.donutChart = this.createChart(
      this.donutCanvas,
      'doughnut',
      this.doughnutData,
      this.doughnutOptions,
      [this.centerTextPlugin]
    );
  }

  // --------------------------
  // AREA chart (trend des Done)
  // --------------------------
  private doneLog: DoneEvent[] = [];
  private highlightIdx: number[] = [];

  readonly areaData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        type: 'line',
        label: 'Réel',
        data: [],
        borderColor: '#8C4BFF',
        backgroundColor: (ctx: ScriptableContext<'line'>) => {
          const chart = ctx.chart as any;
          if (!chart.chartArea) return 'rgba(140,75,255,0.22)';
          const g = chart.ctx.createLinearGradient(
            0,
            chart.chartArea.top,
            0,
            chart.chartArea.bottom
          );
          g.addColorStop(0, 'rgba(140,75,255,0.30)');
          g.addColorStop(1, 'rgba(140,75,255,0.00)');
          return g;
        },
        borderWidth: 1,
        tension: 0.35,
        fill: true,
        pointRadius: (ctx: ScriptableContext<'line'>) =>
          this.highlightIdx.includes(ctx.dataIndex) ? 3 : 0,
        pointHoverRadius: 4,
        pointBackgroundColor: '#8C4BFF',
        pointBorderColor: '#8C4BFF',
      },
    ],
  };

  readonly areaOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: { label: (ctx) => ` ${ctx.parsed.y} tâches` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: this.colors.text } },
      y: {
        beginAtZero: true,
        suggestedMax: 10,
        grid: { color: this.colors.grid },
        ticks: { color: this.colors.text, precision: 0 },
      },
    },
    elements: { point: { borderWidth: 0 } },
  };

  readonly verticalDashesPlugin: Plugin<'line'> = {
    id: 'verticalDashes',
    afterDatasetsDraw: (chart) => {
      const meta = chart.getDatasetMeta(0);
      if (!meta?.data?.length) return;
      const { ctx, chartArea } = chart;
      ctx.save();
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = '#8C4BFF';
      for (const i of this.highlightIdx) {
        const el = meta.data[i] as any;
        if (!el) continue;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y + 6);
        ctx.lineTo(el.x, chartArea.bottom - 8);
        ctx.stroke();
      }
      ctx.restore();
    },
  };

  applyAreaFilter(): void {
    const project = this.normalizeSingle(this.selectedProjectForArea, 'ALL');
    const weeksCount = this.rangeToWeeks(
      this.normalizeSingle(this.selectedRangeArea, '4w') as any
    );

    const { labels, data } = this.buildWeeklySeries(project, weeksCount);

    const maxVal = Math.max(...data, 0);
    // toutes les semaines avec le max
    const idxMaxAll = data
      .map((v, i) => (v === maxVal ? i : -1))
      .filter((i) => i >= 0);

    const idxLast = data.length - 1;

    // combine max + dernier
    this.highlightIdx = Array.from(new Set([...idxMaxAll, idxLast]));

    this.areaData.labels = labels;
    (this.areaData.datasets[0].data as number[]) = data;

    const suggested = Math.max(6, maxVal + 2);
    if (
      this.areaChart?.options?.scales &&
      'y' in this.areaChart.options.scales!
    ) {
      (this.areaChart.options.scales!['y'] as any).suggestedMax = suggested;
    }

    this.areaChart?.update();
  }

  private buildWeeklySeries(
    project: 'ALL' | string,
    weeksCount: number
  ): { labels: string[]; data: number[] } {
    const endWeek = this.startOfWeek(new Date());
    const lastDay = this.addDays(endWeek, 6); // dimanche de la semaine courante
    const startWeek = this.addDays(endWeek, -7 * (weeksCount - 1));

    const weekStarts: Date[] = [];
    for (let d = new Date(startWeek); d <= endWeek; d = this.addDays(d, 7)) {
      weekStarts.push(new Date(d));
    }

    const indexByWeek: Record<string, number> = {};
    const labels: string[] = [];
    weekStarts.forEach((ws, i) => {
      const key = this.weekKey(ws);
      indexByWeek[key] = i;
      labels.push(this.weekLabel(ws));
    });

    const series = new Array(weekStarts.length).fill(0);

    for (const ev of this.doneLog) {
      if (ev.date < startWeek || ev.date > lastDay) continue;
      if (project !== 'ALL' && ev.project !== project) continue;

      const key = this.weekKey(this.startOfWeek(ev.date));
      const idx = indexByWeek[key];
      if (idx != null) {
        series[idx] += ev.count;
      }
    }

    return { labels, data: series };
  }
  private startOfWeek(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    const day = (x.getDay() + 6) % 7;
    x.setDate(x.getDate() - day);
    return x;
  }
  private addDays(d: Date, days: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  }
  private weekNumber(d: Date): number {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - dayNum + 3);
    const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
    const diff = (date.getTime() - firstThursday.getTime()) / 86400000;
    return 1 + Math.floor(diff / 7);
  }
  private weekKey(ws: Date): string {
    return `${ws.getFullYear()}-W${this.weekNumber(ws)}`;
  }
  private weekLabel(ws: Date): string {
    return `S-${this.weekNumber(ws)}`;
  }
  private rangeToWeeks(r: '4w' | '12w' | '6m' | '1y'): number {
    return r === '4w' ? 4 : r === '12w' ? 12 : r === '6m' ? 26 : 52;
  }
  private renderArea(): void {
    this.areaChart?.destroy();
    this.areaChart = this.createChart(
      this.areaCanvas,
      'line',
      this.areaData,
      this.areaOptions,
      [this.verticalDashesPlugin]
    );
  }

  // =====================================================
  // 5) Table (liste + filtres rapides)
  // =====================================================
  tasks: TaskRow[] = [];
  displayedTasks: TaskRow[] = [];
  statusFilter: 'ALL' | Status = 'ALL';
  priorityFilter: 'ALL' | Priority = 'ALL';
  projectFilter: 'ALL' | string = 'ALL';
  deadlineQuick: 'all' | 'overdue' | 'dueSoon' = 'all';
  readonly dueSoonDays = 3;
  readonly todayMs = new Date().setHours(0, 0, 0, 0);

  resetAllFilters(): void {
    this.statusFilter = 'ALL';
    this.priorityFilter = 'ALL';
    this.projectFilter = 'ALL';
    this.deadlineQuick = 'all';
    this.statusSelectValue = 'ALL';
    this.prioritySelectValue = 'ALL';
    this.tableProjectValue = 'ALL';
    this.applyTableFilters();
  }
  applyTableFilters(): void {
    const byStatus = (t: TaskRow) =>
      this.statusFilter === 'ALL' || t.status === this.statusFilter;
    const byPriority = (t: TaskRow) =>
      this.priorityFilter === 'ALL' || t.priority === this.priorityFilter;
    const byProject = (t: TaskRow) =>
      this.projectFilter === 'ALL' || t.project === this.projectFilter;
    const byDeadline = (t: TaskRow) => {
      if (this.deadlineQuick === 'overdue') return this.isOverdue(t);
      if (this.deadlineQuick === 'dueSoon') return this.isDueSoon(t);
      return true;
    };
    this.displayedTasks = this.tasks
      .filter(
        (t) => byStatus(t) && byPriority(t) && byProject(t) && byDeadline(t)
      )
      .sort((a, b) => this.sortTasks(a, b));
  }
  private isOverdue(t: TaskRow): boolean {
    return (
      !!t.deadline && t.status !== 'Done' && t.deadline.getTime() < this.todayMs
    );
  }
  private isDueSoon(t: TaskRow): boolean {
    if (!t.deadline || t.status === 'Done') return false;
    const diffDays = Math.round(
      (t.deadline.getTime() - this.todayMs) / 86_400_000
    );
    return diffDays >= 0 && diffDays <= this.dueSoonDays;
  }
  private priorityRank(p: Priority): number {
    return p === 'High' ? 1 : p === 'Medium' ? 2 : 3;
  }
  private sortTasks(a: TaskRow, b: TaskRow): number {
    const da = a.deadline?.getTime() ?? Number.POSITIVE_INFINITY;
    const db = b.deadline?.getTime() ?? Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    const pr = this.priorityRank(a.priority) - this.priorityRank(b.priority);
    if (pr !== 0) return pr;
    return a.title.localeCompare(b.title);
  }
}