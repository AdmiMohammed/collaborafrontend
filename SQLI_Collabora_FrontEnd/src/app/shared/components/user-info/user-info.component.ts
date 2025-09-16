import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: []
})
export class UserInfoComponent {
  @Input() user!: User | null;
  @Input() initials: string = '';
  
  constructor(private router: Router) {}

  goToProfile(): void {
    if(this.user) {
      // this.router.navigate(['/profile', this.user.id]);
      this.router.navigate(['/dashboard/profile']);
    }
  }
}
