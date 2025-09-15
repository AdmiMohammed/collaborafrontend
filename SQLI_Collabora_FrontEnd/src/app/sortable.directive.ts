import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, Output, SimpleChange, SimpleChanges } from '@angular/core';
import Sortable, { SortableEvent } from 'sortablejs';
import { Task } from 'src/app/models/project';

@Directive({
  selector: '[appSortable]'
})
export class SortableDirective implements AfterViewInit, OnDestroy {
  @Input() items: any[] = [];
  @Input() column: any;   // only used for tasks
  @Input() group: string | null = null;

  @Output() reordered = new EventEmitter<{
    movedItem: any,
    oldIndex: number,
    newIndex: number,
    fromColumn: any | null,
    toColumn: any | null,
    items?: any[]
  }>();

  private draggedTask: Task | null = null;
  private sortable: Sortable | null = null;

  constructor(private el: ElementRef) { }

  ngAfterViewInit() {
    // attach column reference for tasks
    if (this.column) {
      (this.el.nativeElement as any).__columnRef = this.column;
    }

    this.sortable = Sortable.create(this.el.nativeElement, {
      animation: 200,
      ghostClass: 'sortable-ghost',
      group: this.group || undefined,
      scroll: true, // Enable scrolling
      forceAutoScrollFallback: true,
      filter: 'textarea, input, .non-draggable',
      preventOnFilter: false,
      scrollSensitivity: 180, // Distance from edge to start scrolling
      scrollSpeed: 15, // Speed of scrolling
      scrollFn: (offsetX, offsetY) => {
        const container = document.getElementById('container'); // horizontal board

        if (offsetX !== 0 && container) {
          offsetY = 0;
          // Scroll the container horizontally
          container.scrollLeft += offsetX * 1.5;
        }

        return "continue";
      },



      onStart: (evt: SortableEvent) => {
        if (!this.column) return; // skip for projects

        const el = evt.item as HTMLElement;
        const draggedId =
          el.dataset['taskId'] ??
          el.closest('[data-task-id]')?.getAttribute('data-task-id');
        if (!draggedId) return;

        const fromColumn = (evt.from as any).__columnRef;
        this.draggedTask =
          fromColumn.tasks.find((t: { id: any }) => String(t.id) === draggedId) ?? null;
      },

      onEnd: (evt: SortableEvent) => {
        // Task reordering
        if (this.column && this.draggedTask) {
          const fromColumn = (evt.from as any).__columnRef;
          const toColumn = (evt.to as any).__columnRef;

          this.reordered.emit({
            movedItem: this.draggedTask,
            oldIndex: evt.oldIndex!,
            newIndex: evt.newIndex!,
            fromColumn,
            toColumn
          });

          this.draggedTask = null;
          return;
        }

        // Project reordering
        if (!this.column) {
          const movedItem = this.items.splice(evt.oldIndex!, 1)[0];
          this.items.splice(evt.newIndex!, 0, movedItem);

          this.reordered.emit({
            movedItem,
            oldIndex: evt.oldIndex!,
            newIndex: evt.newIndex!,
            fromColumn: null,
            toColumn: null,
            items: this.items
          });
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.sortable) this.sortable.destroy();
  }
}
