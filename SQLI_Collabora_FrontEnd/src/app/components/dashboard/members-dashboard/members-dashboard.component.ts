import { Component, computed, signal } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';

type KpiIcon = 'collab' | 'active30' | 'avgLoad' | 'overload' | 'underuse';

interface KpiItem {
  label: string;
  value: number | string;
  suffix?: string;
  icon: KpiIcon;
  hint?: string;
}

interface MemberLoad {
  memberId: number;
  name: string;
  open: number;   // tâches ouvertes
  done: number;   // terminées (30j)
  projectId: number;
}

interface Project { id: number; name: string; }

type Role = 'Dev' | 'QA' | 'PM' | 'UX' | 'Data' | string;
type LoadStatus = 'Sous-utilisé' | 'Équilibré' | 'Surchargé';

interface MemberRow {
  id: number;
  name: string;
  email: string;
  role: Role;
  projects: { id: number; name: string }[];
  openTasks: number;
  done30d: number;
  due7d: number;
  overdue: number;
  lastActivity: string; // ISO
}

@Component({
  selector: 'app-members-dashboard',
  templateUrl: './members-dashboard.component.html',
  styleUrls: ['./members-dashboard.component.css']
})
export class MembersDashboardComponent {
  // =============================
  // Palette & constantes (readonly)
  // =============================
  readonly colors = {
    text: '#16306B',
    background: '#F4F6FE',
    grid: 'rgba(22,48,107,0.06)',
    high: '#C020D0',
    medium: '#8432DF',
    low: '#FC0FC0',
    highFill: 'rgba(192, 32, 208, 0.75)',
    mediumFill: 'rgba(132, 50, 223, 0.75)',
    lowFill: 'rgba(252, 15, 192, 0.70)',
    highHover: 'rgba(192, 32, 208, 0.92)',
    mediumHover: 'rgba(132, 50, 223, 0.92)',
    lowHover: 'rgba(252, 15, 192, 0.88)'
  } as const;

  readonly UNDERUSE_MAX = 2;
  readonly BALANCED_MIN = 3;
  readonly BALANCED_MAX = 7;
  readonly OVERLOAD_MIN = 8;

  // =============================
  // Données mock (à remplacer API)
  // =============================
  kpis: KpiItem[] = [
    { label: 'Membres en collaboration', value: 18, icon: 'collab' },
    { label: 'Membres actifs (30j)', value: 14, icon: 'active30' },
    { label: 'Charge moyenne (tâches ouvertes / membre)', value: 5.3, icon: 'avgLoad' },
    { label: 'Membres surchargés (≥ 8 tâches)', value: 4, icon: 'overload' },
    { label: 'Membres sous-utilisés (≤ 2 tâches)', value: 3, icon: 'underuse' }
  ];

  projects: Project[] = [
    { id: 1, name: 'Collabora Web' },
    { id: 2, name: 'API .NET' },
    { id: 3, name: 'Mobile' }
  ];

  private allLoads: MemberLoad[] = [
    { memberId: 11, name: 'Sara',    open: 8, done: 12, projectId: 1 },
    { memberId: 12, name: 'Yassine', open: 6, done:  9, projectId: 1 },
    { memberId: 13, name: 'Lamia',   open: 4, done: 10, projectId: 1 },
    { memberId: 14, name: 'Imad',    open: 9, done:  7, projectId: 1 },
    { memberId: 11, name: 'Sara',    open: 3, done:  5, projectId: 2 },
    { memberId: 15, name: 'Nabil',   open: 5, done:  2, projectId: 2 },
    { memberId: 12, name: 'Yassine', open: 2, done:  6, projectId: 2 },
    { memberId: 16, name: 'Mouna',   open: 7, done:  4, projectId: 3 },
    { memberId: 14, name: 'Imad',    open: 2, done:  8, projectId: 3 }
  ];

  // =============================
  // BAR — Charge vs Terminées
  // =============================
  selectedProjectId = signal<number>(0);

  barData = computed<ChartData<'bar'>>(() => {
    const pid = this.selectedProjectId();
    const rows = pid === 0 ? this.aggregateAllProjects(this.allLoads)
                           : this.allLoads.filter(x => x.projectId === pid);
    const labels = rows.map(r => r.name);
    const open = rows.map(r => r.open);
    const done = rows.map(r => r.done);

    return {
      labels,
      datasets: [
        {
          label: 'Charge (ouvertes)',
          data: open,
          backgroundColor: this.colors.mediumFill,
          hoverBackgroundColor: this.colors.mediumHover,
          borderColor: this.colors.medium,
          borderWidth: 1,
          borderRadius: 8,
          maxBarThickness: 18,
          categoryPercentage: 0.66,
          barPercentage: 0.82
        },
        {
          label: 'Terminées (30j)',
          data: done,
          backgroundColor: this.colors.lowFill,
          hoverBackgroundColor: this.colors.lowHover,
          borderColor: this.colors.low,
          borderWidth: 1,
          borderRadius: 8,
          maxBarThickness: 18,
          categoryPercentage: 0.66,
          barPercentage: 0.82
        }
      ]
    };
  });

  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500, easing: 'easeOutQuart' },
    scales: {
      x: { grid: { color: this.colors.grid }, ticks: { color: this.colors.text }, stacked: false },
      y: { beginAtZero: true, grid: { color: this.colors.grid }, ticks: { color: this.colors.text, precision: 0 }, stacked: false }
    },
    plugins: { legend: { display: true, labels: { color: this.colors.text } }, tooltip: { mode: 'index', intersect: false } }
  };

  onProjectChange(v: string | number) { this.selectedProjectId.set(Number(v) || 0); }

  private aggregateAllProjects(rows: MemberLoad[]): MemberLoad[] {
    const map = new Map<number, MemberLoad>();
    for (const r of rows) {
      const cur = map.get(r.memberId);
      if (!cur) map.set(r.memberId, { ...r, projectId: 0 });
      else { cur.open += r.open; cur.done += r.done; }
    }
    return Array.from(map.values()).sort((a, b) => b.open - a.open);
  }

  // =============================
  // LINE — % surchargés / sous‑utilisés (12 semaines)
  // =============================
  weeks2: string[] = this.buildLastNWeeks(12);
  overloadedPct: number[] = [18, 22, 20, 27, 33, 28, 24, 21, 19, 17, 16, 14];
  underusedPct:  number[] = [12, 10, 14, 15, 11, 13, 18, 22, 25, 27, 28, 30];

  areaDataOverUnder: ChartData<'line'> = {
    labels: this.weeks2,
    datasets: [
      {
        type: 'line',
        label: '% Surchargés (≥ 8)',
        data: this.overloadedPct,
        borderColor: this.colors.high,
        backgroundColor: (ctx) => {
          const { ctx: c, chartArea } = (ctx.chart as any);
          if (!chartArea) return 'rgba(192, 32, 208, 0.20)';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(192, 32, 208, 0.28)');
          g.addColorStop(1, 'rgba(192, 32, 208, 0.00)');
          return g;
        },
        borderWidth: 1,
        tension: 0.35,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: this.colors.high,
        pointBorderColor: this.colors.high
      },
      {
        type: 'line',
        label: '% Sous-utilisés (≤ 2)',
        data: this.underusedPct,
        borderColor: this.colors.low,
        backgroundColor: (ctx) => {
          const { ctx: c, chartArea } = (ctx.chart as any);
          if (!chartArea) return 'rgba(252, 15, 192, 0.16)';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(252, 15, 192, 0.22)');
          g.addColorStop(1, 'rgba(252, 15, 192, 0.00)');
          return g;
        },
        borderWidth: 1,
        tension: 0.35,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: this.colors.low,
        pointBorderColor: this.colors.low
      }
    ]
  };

  areaOptionsOverUnder: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: this.colors.text } },
      tooltip: { mode: 'index', intersect: false, callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.y}%` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: this.colors.text } },
      y: { beginAtZero: true, max: 100, grid: { color: this.colors.grid }, ticks: { color: this.colors.text, stepSize: 10, callback: (v: any) => `${v}%` } }
    },
    elements: { point: { borderWidth: 0 } }
  };

  private buildLastNWeeks(n: number): string[] {
    const labels: string[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      labels.push(`S ${String(this.getISOWeek(d)).padStart(2, '0')}`);
    }
    return labels;
  }
  private getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
  }

  // =============================
  // DONUT — Répartition de charge
  // =============================
  colorsDonut = {
    underFill:  this.colors.lowFill,
    underBorder:this.colors.low,
    balancedFill:  this.colors.mediumFill,
    balancedBorder:this.colors.medium,
    overFill:  this.colors.highFill,
    overBorder:this.colors.high,
    text: this.colors.text
  } as const;

  selectedProjectDonut: 'ALL' | string = 'ALL';
  get projectNames(): string[] { return this.projects.map(p => p.name); }
  applyProjectFilter(value: string) { this.selectedProjectDonut = (value === 'ALL' ? 'ALL' : value); this.refreshDonut(); }

  countsDonut = { under: 0, balanced: 0, over: 0 };
  get totalMembersDonut(): number { return this.countsDonut.under + this.countsDonut.balanced + this.countsDonut.over; }

  doughnutData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: any) => {
        const total = this.totalMembersDonut || 1;
        const value = ctx.parsed as number;
        const pct = Math.round((value / total) * 100);
        return ` ${ctx.label}: ${value} (${pct}%)`;
      } } }
    }
  };

  centerTextPlugin = {
    id: 'centerText',
    beforeDraw: (chart: any) => {
      const { ctx, chartArea } = chart; if (!chartArea) return;
      const total = this.totalMembersDonut;
      const cx = (chartArea.left + chartArea.right) / 2;
      const cy = (chartArea.top + chartArea.bottom) / 2;
      ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = this.colorsDonut.text;
      ctx.font = '700 18px Inter, system-ui, sans-serif'; ctx.fillText(String(total), cx, cy - 4);
      ctx.font = '600 12px Inter, system-ui, sans-serif'; ctx.fillText('membres', cx, cy + 16);
      ctx.restore();
    }
  };

  refreshDonut() {
    let rows: { memberId: number; open: number; name: string }[];
    if (this.selectedProjectDonut === 'ALL') {
      rows = this.aggregateAllProjects(this.allLoads).map(r => ({ memberId: r.memberId, open: r.open, name: r.name }));
    } else {
      const p = this.projects.find(pp => pp.name === this.selectedProjectDonut);
      const pid = p?.id ?? 0;
      rows = this.allLoads.filter(x => x.projectId === pid).map(r => ({ memberId: r.memberId, open: r.open, name: r.name }));
    }
    let under = 0, balanced = 0, over = 0;
    for (const r of rows) {
      if (r.open <= this.UNDERUSE_MAX) under++;
      else if (r.open >= this.OVERLOAD_MIN) over++;
      else balanced++;
    }
    this.countsDonut = { under, balanced, over };
    this.doughnutData = {
      labels: ['Sous-utilisés', 'Équilibrés', 'Surchargés'],
      datasets: [
        {
          data: [under, balanced, over],
          backgroundColor: [this.colorsDonut.underFill, this.colorsDonut.balancedFill, this.colorsDonut.overFill],
          borderColor:     [this.colorsDonut.underBorder, this.colorsDonut.balancedBorder, this.colorsDonut.overBorder],
          borderWidth: 1,
          hoverOffset: 4
        }
      ]
    };
  }

  // =============================
  // Tableau — Charge par membre
  // =============================
  rows: MemberRow[] = [
    { id:11, name:'Sara',    email:'sara@sqli.com',    role:'Dev', projects:[{id:1,name:'Collabora Web'},{id:2,name:'API .NET'}], openTasks:11, done30d:17, due7d:3, overdue:1, lastActivity:'2025-08-23T10:11:00Z' },
    { id:12, name:'Yassine', email:'yassine@sqli.com', role:'Dev', projects:[{id:1,name:'Collabora Web'},{id:2,name:'API .NET'}], openTasks:8,  done30d:15, due7d:2, overdue:0, lastActivity:'2025-08-24T08:45:00Z' },
    { id:14, name:'Imad',    email:'imad@sqli.com',    role:'QA',  projects:[{id:1,name:'Collabora Web'},{id:3,name:'Mobile'}],   openTasks:6,  done30d:15, due7d:1, overdue:0, lastActivity:'2025-08-24T07:00:00Z' },
    { id:13, name:'Lamia',   email:'lamia@sqli.com',   role:'UX',  projects:[{id:1,name:'Collabora Web'}],                         openTasks:4,  done30d:10, due7d:1, overdue:0, lastActivity:'2025-08-22T15:10:00Z' },
    { id:16, name:'Mouna',   email:'mouna@sqli.com',   role:'PM',  projects:[{id:3,name:'Mobile'}],                                 openTasks:7,  done30d: 4, due7d:2, overdue:0, lastActivity:'2025-08-21T14:30:00Z' },
    { id:15, name:'Nabil',   email:'nabil@sqli.com',   role:'Dev', projects:[{id:2,name:'API .NET'}],                               openTasks:2,  done30d: 2, due7d:0, overdue:0, lastActivity:'2025-08-20T11:00:00Z' }
  ];

  projectFilter = 0;                   // 0 = Tous
  roleFilter: Role | 'Tous' = 'Tous';
  statusFilter: LoadStatus | 'Tous' = 'Tous';
  searchTerm = '';

  roleOptions: (Role | 'Tous')[] = ['Tous', 'Dev', 'QA', 'PM', 'UX', 'Data'];
  statusOptions: (LoadStatus | 'Tous')[] = ['Tous', 'Sous-utilisé', 'Équilibré', 'Surchargé'];

  ngOnInit() { this.refreshDonut(); }

  get projectOptions() { return [{ id: 0, name: 'Tous' }, ...this.projects]; }

  get displayedMembers(): MemberRow[] {
    let res = [...this.rows];
    if (this.projectFilter) res = res.filter(r => r.projects.some(p => p.id === this.projectFilter));
    if (this.roleFilter !== 'Tous') res = res.filter(r => r.role === this.roleFilter);
    if (this.statusFilter !== 'Tous') res = res.filter(r => this.getLoadStatus(r.openTasks) === this.statusFilter);
    const q = this.searchTerm.trim().toLowerCase();
    if (q) res = res.filter(r => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    return res.sort(this.sortByOpenDesc.bind(this));
  }

  // =============================
  // Helpers (table + UI)
  // =============================
  getLoadStatus(open: number): LoadStatus {
    if (open <= this.UNDERUSE_MAX) return 'Sous-utilisé';
    if (open >= this.OVERLOAD_MIN) return 'Surchargé';
    return 'Équilibré';
  }

  getOpenColorClass(n: number): string {
    if (n >= this.OVERLOAD_MIN) return 'text-[#C020D0]';
    if (n <= this.UNDERUSE_MAX) return 'text-[#FC0FC0]';
    return 'text-[#8432DF]';
  }

  isOverloaded(n: number) { return n >= this.OVERLOAD_MIN; }
  private sortByOpenDesc(a: MemberRow, b: MemberRow) { return b.openTasks - a.openTasks || a.name.localeCompare(b.name); }

  timeAgo(iso: string): string {
    const d = new Date(iso).getTime();
    const diff = Math.max(0, Date.now() - d);
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'aujourd’hui';
    if (days === 1) return 'il y a 1 j';
    return `il y a ${days} j`;
  }

  getProjectNames(projects: { id: number; name: string }[]): string {
    if (!projects?.length) return '';
    return projects.map(p => p.name).join(', ');
  }

  resetMemberFilters() {
    this.projectFilter = 0;
    this.roleFilter = 'Tous';
    this.statusFilter = 'Tous';
    this.searchTerm = '';
  }

  // TrackBy helpers
  trackByProject = (_: number, p: Project) => p.id;
  trackByMember  = (_: number, m: MemberRow) => m.id;
  trackByKpi     = (_: number, k: KpiItem) => k.label;
  trackBySimple  = (_: number, v: any) => v;
}
