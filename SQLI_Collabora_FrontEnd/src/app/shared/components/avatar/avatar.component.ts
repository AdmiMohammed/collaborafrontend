import { Component, Input } from '@angular/core';
import { ProjectMemberDto } from 'src/app/services/project-service/project.service';
import { AppUser } from 'src/app/services/user-service/user1.service';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.css']
})
export class AvatarComponent {
  @Input() user!: AppUser | ProjectMemberDto;
  @Input() size: 'sm' | 'md' | 'lg' | 'header' | 'global-header' = 'md'

  get initials(): string {
    if('fullName' in this.user){
          return `${this.user.fullName.split(' ')[0][0] ?? ''}${this.user.fullName.split(' ')[0][0] ?? ''}`.toUpperCase();
    }
    return `${this.user.firstName[0]}${this.user.lastName[0]}`.toUpperCase();
  }

  get sizeClasses(): string {
    switch (this.size){
      case 'sm': return 'w-6 h-6 rounded-full border-2 border-white shadow-sm text-[10px]';
      case 'lg': return 'w-16 h-16 text-xl';
      case 'header': return 'sm:w-8 sm:h-8 w-9 h-9 rounded-full border-2 border-white shadow-md'
      case 'global-header': return 'rounded-full object-cover w-10 h-10'
      default: return 'w-10 h-10 text-base';
    }
  }
}
