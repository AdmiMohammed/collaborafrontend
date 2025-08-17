
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectReadDto } from 'src/app/services/project-service/project.service';

@Component({
  selector: 'app-project-card',
  templateUrl: './project-card.component.html',
})
export class ProjectCardComponent {
  router: Router;
  @Input() project!: ProjectReadDto;
  @Input() index: number = 0;
  @Input() view: 'grid' | 'list' = 'grid';

  constructor(router: Router) {
    this.router = router
  }

  badgeColors = [
    { text: 'text-[#A855F7]', bg: 'bg-[#F3E8FF]' }, // lavande clair
    { text: 'text-[#EC4899]', bg: 'bg-[#FFE4F1]' }, // rose pastel
    { text: 'text-[#6366F1]', bg: 'bg-[#E0E7FF]' }, // bleu indigo doux
    { text: 'text-[#0EA5E9]', bg: 'bg-[#E0F7FE]' }, // bleu ciel clair
    { text: 'text-[#F97316]', bg: 'bg-[#FFF1E6]' }, // orange clair
  ];


  getRandomBadgeColor(index: number) {
    return this.badgeColors[index % this.badgeColors.length];
  }

  goToProject(id: number) {
    return this.router.navigate(['/projects', id])
  }
  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

}
