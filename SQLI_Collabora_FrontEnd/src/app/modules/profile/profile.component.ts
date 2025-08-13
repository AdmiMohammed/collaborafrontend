import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user-service/user.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  isEditing = false;

  userData: User = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    avatar: ''
  };

  editedUserData: User = { ...this.userData };

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    // Si aucun utilisateur n’est encore en mémoire → fetch depuis API
    if (!this.userService.getCurrentUserValue()) {
      this.userService.fetchCurrentUser().subscribe();
    }

    // On écoute les changements du BehaviorSubject
    this.userService.currentUser$.subscribe((user: User | null) => {
      if (user) {
        this.userData = user;
        this.editedUserData = { ...user };
      }
    });
  }

  handleEdit() {
    this.isEditing = true;
    this.editedUserData = { ...this.userData };
  }

  handleCancel() {
    this.isEditing = false;
  }

  handleSave() {
    this.userService.updateUser(this.editedUserData).subscribe({
      next: () => {
        this.isEditing = false;
        // éventuellement une notification de succès
      },
      error: (err) => {
        console.error('Erreur lors de la sauvegarde :', err);
      }
    });
  }

  get initials(): string {
    const fullName = `${this.userData.firstName} ${this.userData.lastName}`;
    return fullName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  }
}
