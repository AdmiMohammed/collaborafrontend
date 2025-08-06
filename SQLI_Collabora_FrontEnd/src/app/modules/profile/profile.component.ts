import { Component } from '@angular/core';
import { UserService } from 'src/app/services/user-service/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  // isEditing = false;
  // userData = {
  //   email: '',
  //   firstName: '',
  //   lastName : '',
  //   phoneNumber: ''
  // };

  // constructor(private userService: UserService) {}

  // handleEdit() {
  //   this.isEditing = true;
  // }

  // handleSave() {
  //   this.userService.updateUser(this.userData).subscribe({
  //     next: () => {
  //       this.isEditing = false;
  //       // affichage d'une notification 
  //     },
  //     error: (err) => {
  //       console.error('Erreur lors de la sauvegarde :', err);
  //       // affichage d'une erreur 
  //     }
  //   });
  // }

  // handleCancel() {
  //   this.isEditing = false;
  // }
  isEditing = false;

  profile = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Frontend Developer',
    avatar: '',
    about: 'Passionate about building great user interfaces.'
  };

  editedProfile = { ...this.profile };

  handleEdit() {
    this.isEditing = true;
    this.editedProfile = { ...this.profile };
  }

  handleSave() {
    // Appel API ici si besoin
    this.profile = { ...this.editedProfile };
    this.isEditing = false;
  }

  handleCancel() {
    this.isEditing = false;
  }

  get initials(): string {
    return this.profile.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  }
}
