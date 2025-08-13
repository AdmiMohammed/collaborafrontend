import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-project-card-skeleton',
  templateUrl: './project-card-skeleton.component.html'
})
export class ProjectCardSkeletonComponent {
  /** 'grid' | 'list' si un jour tu veux une variante liste */
  @Input() view: 'grid' | 'list' = 'grid';
}
