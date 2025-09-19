import { Component } from '@angular/core';
import { ChartData, ChartOptions, Plugin } from 'chart.js';

type Status = 'En cours' | 'Terminé' | 'En retard';

type ProjectRow = {
  id: number;
  name: string;
  description?: string | null;

  // BD
  startDate: Date; // StartDate
  estimatedEndDate: Date; // EstimatedEndDate
  createdBy: number; // CreatedBy (FK)
  createdByName?: string; // optionnel
  createdAt: Date; // CreatedAt
  lastModifiedAt?: Date | null; // LastModifiedAt
  templateId?: number | null; // TemplateId
  completedRealTasks: number; // CompletedRealTasks
  totalRealTasks: number; // TotalRealTasks
  isDeleted?: boolean; // IsDeleted

  // calculés
  _progress: number; // %
  _status: 'À venir' | 'En cours' | 'Terminé' | 'En retard';
};

@Component({
  selector: 'app-projects-dashboard',
  templateUrl: './projects-dashboard.component.html',
})
export class ProjectsDashboardComponent {
  // Palette
  colors = {
    aVenir: '#4FC3F7',
    text: '#16306B',
    enCours: '#8432DF',
    termine: '#C020D0',
    enRetard: '#FC0FC0',
    bg: '#F4F6FE',
  };

  // KPI (mock)
  kpis = [
    {
      key: 'active',
      label: 'Projets actifs',
      value: 12,
      suffix: '',
      icon: 'active',
    },
    {
      key: 'avg',
      label: 'Progression moyenne',
      value: 64,
      suffix: ' %',
      icon: 'avg',
    },
    {
      key: 'done',
      label: 'Projets terminés',
      value: 8,
      suffix: '',
      icon: 'done',
    },
    {
      key: 'late',
      label: 'Projets en retard',
      value: 3,
      suffix: '',
      icon: 'late',
    },
    {
      key: 'due7',
      label: 'Échéance ≤ 7 jours',
      value: 5,
      suffix: '',
      icon: 'due7',
    },
  ];

  // Table (mock)
  rows: ProjectRow[] = [
    {
      id: 1,
      name: 'Collabora Web',
      description: 'Dashboard + AI assistant',
      startDate: new Date('2025-01-01'),
      estimatedEndDate: new Date('2025-12-31'),
      createdBy: 7,
      createdByName: 'A. Manager',
      createdAt: new Date('2025-01-02'),
      lastModifiedAt: new Date(),
      templateId: null,
      completedRealTasks: 78,
      totalRealTasks: 120,
      _progress: 0,
      _status: 'En cours',
    },
    {
      id: 2,
      name: 'Mobile Client',
      startDate: new Date('2025-02-01'),
      estimatedEndDate: new Date(new Date().setDate(new Date().getDate() + 12)),
      createdBy: 9,
      createdAt: new Date('2025-02-02'),
      lastModifiedAt: new Date(),
      templateId: 3,
      completedRealTasks: 46,
      totalRealTasks: 100,
      _progress: 0,
      _status: 'En cours',
    },
    {
      id: 3,
      name: 'API .NET',
      startDate: new Date('2025-01-10'),
      estimatedEndDate: new Date(),
      createdBy: 7,
      createdAt: new Date('2025-01-11'),
      lastModifiedAt: new Date(),
      templateId: null,
      completedRealTasks: 100,
      totalRealTasks: 100,
      _progress: 0,
      _status: 'Terminé',
    },
    {
      id: 4,
      name: 'Data Pipeline',
      startDate: new Date('2025-03-01'),
      estimatedEndDate: new Date(new Date().setDate(new Date().getDate() - 3)),
      createdBy: 12,
      createdAt: new Date('2025-03-02'),
      lastModifiedAt: new Date(),
      completedRealTasks: 31,
      totalRealTasks: 100,
      _progress: 0,
      _status: 'En retard',
    },
  ];

  // Petits jeux de données pour les charts
  projects: Array<{
    name: string;
    progress: number;
    status: Status;
    due: Date;
  }> = [
    {
      name: 'Collabora Web',
      progress: 78,
      status: 'En cours',
      due: new Date(new Date().setDate(new Date().getDate() + 5)),
    },
    {
      name: 'Mobile Client',
      progress: 46,
      status: 'En cours',
      due: new Date(new Date().setDate(new Date().getDate() + 12)),
    },
    { name: 'API .NET', progress: 100, status: 'Terminé', due: new Date() },
    {
      name: 'Data Pipeline',
      progress: 31,
      status: 'En retard',
      due: new Date(new Date().setDate(new Date().getDate() - 3)),
    },
    {
      name: 'SmartHire',
      progress: 92,
      status: 'En cours',
      due: new Date(new Date().setDate(new Date().getDate() + 1)),
    },
  ];

  counts = { enCours: 3, termine: 1, enRetard: 1, aVenir: 2 };

  // ===== CHARTS
  // Barres
  barData: ChartData<'bar'> = {
    labels: this.projects.map((p) => p.name),
    datasets: [
      {
        label: 'Progression',
        data: this.projects.map((p) => p.progress),
        borderRadius: 10,
        backgroundColor: this.projects.map(() => this.colors.enCours),
        hoverBackgroundColor: this.projects.map(() => this.colors.termine),
        maxBarThickness: 18,
      },
    ],
  };

  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(22,48,107,0.06)' },
        ticks: { color: this.colors.text },
      },
      y: {
        suggestedMin: 0,
        suggestedMax: 100,
        grid: { color: 'rgba(22,48,107,0.06)' },
        ticks: { color: this.colors.text, callback: (v: any) => `${v}%` },
      },
    },
    plugins: { legend: { display: false } },
  };

  // Donut
  totalProjets =
    this.counts.aVenir +
    this.counts.enCours +
    this.counts.termine +
    this.counts.enRetard;

  doughnutData: ChartData<'doughnut'> = {
    labels: ['À venir', 'En cours', 'Terminé', 'En retard'],
    datasets: [
      {
        data: [
          this.counts.aVenir,
          this.counts.enCours,
          this.counts.termine,
          this.counts.enRetard,
        ],
        backgroundColor: [
          this.colors.aVenir,
          this.colors.enCours,
          this.colors.termine,
          this.colors.enRetard,
        ],
        borderWidth: 0,
      },
    ],
  };

  doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    radius: 60,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const total = this.totalProjets || 1;
            const value = ctx.parsed as number;
            const pct = Math.round((value / total) * 100);
            return `${ctx.label}: ${value} (${pct}%)`;
          },
        },
      },
    },
  };

  // Texte centré du donut
  centerTextPlugin: Plugin<'doughnut'> = {
    id: 'centerText',
    afterDraw: (chart) => {
      const { ctx, chartArea } = chart;
      if (!ctx || !chartArea) return;
      const total = this.totalProjets || 1; // ✅ prend aussi "À venir"
      const pctTermine = Math.round((this.counts.termine / total) * 100);
      const cx = (chartArea.left + chartArea.right) / 2;
      const cy = (chartArea.top + chartArea.bottom) / 2;
      ctx.save();
      ctx.fillStyle = this.colors.text;
      ctx.font = '600 16px Inter, system-ui, -apple-system, Segoe UI, Roboto';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${pctTermine}%`, cx, cy);
      ctx.restore();
    },
  };

  // ---- Filtres & séries area
  allProjects = [
    { id: 1, name: 'Collabora Web' },
    { id: 2, name: 'Mobile Client' },
  ];
  selectedProjectId = 1;
  range: 'auto' | '12' | '6' | '3' = 'auto';

  private monthsFull: string[] = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ];
  highlightIdx: number[] = [5, 11];

  private projectMeta: Record<
    number,
    { start: Date; end: Date; total: number }
  > = {
    1: {
      start: new Date('2025-01-01'),
      end: new Date('2025-12-31'),
      total: 120,
    },
    2: {
      start: new Date('2025-02-01'),
      end: new Date('2025-11-30'),
      total: 90,
    },
  };

  private doneByDay: Record<number, Array<{ day: string; count: number }>> = {
    1: [
      { day: '2024-10-03', count: 2 },
      { day: '2025-01-17', count: 2 },
      { day: '2025-02-07', count: 4 },
      { day: '2025-03-12', count: 6 },
      { day: '2025-04-05', count: 5 },
      { day: '2025-05-14', count: 9 },
      { day: '2025-06-02', count: 40 },
      { day: '2025-06-23', count: 8 },
      { day: '2025-08-10', count: 1 },
      { day: '2025-10-05', count: 1 },
      { day: '2025-11-12', count: 1 },
      { day: '2025-12-03', count: 1 },
    ],
    2: [
      { day: '2025-02-10', count: 3 },
      { day: '2025-03-03', count: 4 },
      { day: '2025-04-20', count: 5 },
      { day: '2025-06-15', count: 8 },
      { day: '2025-07-28', count: 1 },
      { day: '2025-09-09', count: 7 },
      { day: '2025-10-21', count: 6 },
    ],
  };

  private buildMonthEndsBetween(start: Date, end: Date): Date[] {
    const s = new Date(start.getFullYear(), start.getMonth(), 1);
    const e = this.endOfMonth(end);
    const ends: Date[] = [];
    let cursor = new Date(s);
    while (cursor <= e) {
      ends.push(this.endOfMonth(cursor));
      cursor = this.addMonths(cursor, 1);
    }
    return ends;
  }

  private endOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  }
  private addMonths(d: Date, n: number) {
    return new Date(d.getFullYear(), d.getMonth() + n, 1);
  }
  private dateKey(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  private buildMonthEnds(referenceEnd: Date, L: number): Date[] {
    const ends: Date[] = [];
    const endThisMonth = this.endOfMonth(referenceEnd);
    for (let i = L - 1; i >= 0; i--) {
      const monthStart = this.addMonths(
        new Date(endThisMonth.getFullYear(), endThisMonth.getMonth(), 1),
        -i
      );
      ends.push(this.endOfMonth(monthStart));
    }
    return ends;
  }

  private expectedPctByMonth(
    monthEnds: Date[],
    start: Date,
    end: Date
  ): number[] {
    const totalDays = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / 86400000)
    );
    return monthEnds.map((mEnd) => {
      const elapsed = Math.round(
        (Math.min(mEnd.getTime(), end.getTime()) - start.getTime()) / 86400000
      );
      return Math.max(
        0,
        Math.min(100, Math.round((elapsed / totalDays) * 100))
      );
    });
  }

  private realPctByMonth(
    monthEnds: Date[],
    daily: Array<{ day: string; count: number }>,
    total: number
  ): number[] {
    const map: Record<string, number> = {};
    for (const r of daily) map[r.day] = (map[r.day] ?? 0) + r.count;

    const lastEnd = monthEnds[monthEnds.length - 1];
    let cum = 0;
    const series: number[] = [];
    let cursor = new Date(
      monthEnds[0].getFullYear(),
      monthEnds[0].getMonth(),
      1
    );
    const lastCursor = new Date(
      lastEnd.getFullYear(),
      lastEnd.getMonth(),
      lastEnd.getDate()
    );
    while (cursor <= lastCursor) {
      cum += map[this.dateKey(cursor)] ?? 0;
      const matchIdx = monthEnds.findIndex(
        (m) => this.dateKey(m) === this.dateKey(cursor)
      );
      if (matchIdx >= 0) {
        const pct =
          total > 0 ? Math.min(100, Math.round((cum / total) * 100)) : 0;
        series[matchIdx] = pct;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    for (let i = 0, last = 0; i < monthEnds.length; i++) {
      if (series[i] == null) series[i] = last;
      last = series[i];
    }
    return series;
  }

  // Area chart
  areaData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        type: 'line',
        label: 'Réel',
        data: [],
        borderColor: '#8C4BFF',
        backgroundColor: (ctx) => {
          const { ctx: c, chartArea } = ctx.chart;
          if (!chartArea) return 'rgba(140,75,255,0.22)';
          const g = c.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom
          );
          g.addColorStop(0, 'rgba(140,75,255,0.35)');
          g.addColorStop(1, 'rgba(140,75,255,0.00)');
          return g;
        },
        borderWidth: 1,
        tension: 0.35,
        fill: true,
        pointRadius: (ctx) =>
          this.highlightIdx.includes(ctx.dataIndex) ? 3 : 0,
        pointHoverRadius: 4,
        pointBackgroundColor: '#8C4BFF',
        pointBorderColor: '#8C4BFF',
      },
      {
        type: 'line',
        label: 'Attendu',
        data: [],
        borderColor: '#9ca3af',
        borderDash: [6, 6],
        borderWidth: 1,
        tension: 0.25,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
      {
        label: 'baseline-dots',
        data: [],
        pointRadius: 2,
        pointHoverRadius: 2,
        pointBackgroundColor: '#16306B',
        pointBorderColor: '#16306B',
        showLine: false,
        yAxisID: 'y',
      },
    ],
  };

  areaOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.y}%`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#16306B' } },
      y: {
        beginAtZero: true,
        suggestedMax: 100,
        grid: { color: 'rgba(22,48,107,0.06)' },
        ticks: { color: '#16306B', callback: (v: any) => `${v}%` },
      },
    },
    elements: { point: { borderWidth: 0 } },
  };

  verticalDashesPlugin: Plugin<'line'> = {
    id: 'verticalDashes',
    afterDatasetsDraw: (chart) => {
      const meta = chart.getDatasetMeta(0);
      if (!meta?.data?.length) return;
      const { ctx, chartArea } = chart;
      ctx.save();
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = '#8C4BFF';
      for (const i of this.highlightIdx) {
        const el: any = meta.data[i];
        if (!el) continue;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y + 6);
        ctx.lineTo(el.x, chartArea.bottom - 8);
        ctx.stroke();
      }
      ctx.restore();
    },
  };

  // Chargement area
  reloadArea() {
    const meta = this.projectMeta[this.selectedProjectId];
    const raw = (this.doneByDay[this.selectedProjectId] ?? [])
      .slice()
      .sort((a, b) => a.day.localeCompare(b.day));

    let monthEnds: Date[];
    if (this.range === 'auto') {
      monthEnds = this.buildMonthEndsBetween(meta.start, meta.end);
    } else {
      const L = parseInt(this.range, 10);
      monthEnds = this.buildMonthEnds(meta.end, L);
    }

    this.areaData.labels = monthEnds.map((m) => this.monthsFull[m.getMonth()]);

    const real = this.realPctByMonth(
      monthEnds,
      raw.filter((r) => {
        const d = new Date(r.day);
        return d >= meta.start && d <= meta.end;
      }),
      meta.total
    );

    const expected = this.expectedPctByMonth(monthEnds, meta.start, meta.end);

    (this.areaData.datasets[0].data as number[]) = real;
    (this.areaData.datasets[1].data as number[]) = expected;
    (this.areaData.datasets[2].data as { x: number; y: number }[]) =
      monthEnds.map((_, i) => ({ x: i, y: 0 }));

    const L = monthEnds.length;
    const mid = Math.max(0, Math.floor((L - 1) / 2));
    this.highlightIdx = [mid, L - 1];
  }

  // Helpers UI
  statusBadge(s: ProjectRow['_status']) {
    return {
      'bg-primary-start/10 text-primary-start': s === 'En cours',
      'bg-primary-mid/10 text-primary-mid': s === 'Terminé',
      'bg-primary-end/10 text-primary-end': s === 'En retard',
      'bg-background text-Text/70': s === 'À venir',
    };
  }

  dotByStatus(s: ProjectRow['_status']) {
    return {
      'bg-primary-start': s === 'En cours',
      'bg-primary-mid': s === 'Terminé',
      'bg-primary-end': s === 'En retard',
      'bg-Text/30': s === 'À venir',
    };
  }

  progressBarClass(p: ProjectRow) {
    return {
      'bg-primary-start': p._status === 'En cours',
      'bg-primary-mid': p._status === 'Terminé',
      'bg-primary-end': p._status === 'En retard',
      'bg-Text/30': p._status === 'À venir',
    };
  }

  dueBadge(p: ProjectRow) {
    const today = new Date();
    const days = Math.ceil(
      (p.estimatedEndDate.getTime() - today.getTime()) / 86400000
    );
    return {
      'bg-primary-end/10 text-primary-end': days < 0 && p._status !== 'Terminé',
      'bg-primary-start/10 text-primary-start': days >= 0 && days <= 7,
      'bg-background text-Text/70': days > 7 || p._status === 'Terminé',
    };
  }

  private computeDerived(p: ProjectRow): ProjectRow {
    const pct = Math.min(
      100,
      Math.round((p.completedRealTasks / Math.max(1, p.totalRealTasks)) * 100)
    );
    const today = new Date();
    const isDone = pct >= 100 || p.completedRealTasks >= p.totalRealTasks;

    let status: ProjectRow['_status'];
    if (isDone) status = 'Terminé';
    else if (p.startDate > today) status = 'À venir';
    else if (today > p.estimatedEndDate) status = 'En retard';
    else status = 'En cours';

    return { ...p, _progress: pct, _status: status };
  }

  constructor() {
    this.rows = this.rows.map((r) => this.computeDerived(r));
    this.reloadArea();
  }
}