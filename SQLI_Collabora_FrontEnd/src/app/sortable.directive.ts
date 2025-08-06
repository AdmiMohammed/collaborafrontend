import {
  Directive,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
} from '@angular/core';
import Sortable, { SortableEvent } from 'sortablejs';

@Directive({
  selector: '[appSortable]',
})
export class SortableDirective implements AfterViewInit {
  @Input() items: any[] = [];
  @Output() projectsReordered = new EventEmitter<any[]>();

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    Sortable.create(this.el.nativeElement, {
      animation: 250,
      ghostClass: 'sortable-ghost',
      onEnd: (evt: SortableEvent) => { // ✅ ici
        const movedItem = this.items.splice(evt.oldIndex!, 1)[0];
        this.items.splice(evt.newIndex!, 0, movedItem);
        this.projectsReordered.emit(this.items);
      },
    });
  }
}