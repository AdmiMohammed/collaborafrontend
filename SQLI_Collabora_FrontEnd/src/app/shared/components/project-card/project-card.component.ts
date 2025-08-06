
import { Component, Input } from '@angular/core';
import { ProjectReadDto } from 'src/app/services/project-service/project.service';

@Component({
  selector: 'app-project-card',
  templateUrl: './project-card.component.html',
})
export class ProjectCardComponent {
  @Input() project!: ProjectReadDto;
  @Input() index: number = 0;

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
}
