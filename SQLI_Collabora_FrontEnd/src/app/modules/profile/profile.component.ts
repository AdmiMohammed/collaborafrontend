import { Component, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user-service/user.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './profile.component.html',
  styleUrls: []
})
export class ProfileComponent implements OnInit {
  isEditing = false;
  private destroy$ = new Subject<void>();
  selectedAvatarFile: File | null = null;

  userData: User = {
    id: 0,
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    profilePictureUrl: ''
  };
  editedUserData: User = { ...this.userData };

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    // Fetch user si pas déjà en mémoire
    if (!this.userService.getCurrentUserValue()) {
      this.userService.fetchCurrentUser().subscribe();
    }

    // Écoute les changements du BehaviorSubject
    this.userService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        this.userData = user;
        this.editedUserData = { ...user };
      }
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  handleEdit() {
    this.isEditing = true;
    this.editedUserData = { ...this.userData };
  }

  handleCancel() {
    this.isEditing = false;
    if (this.editedUserData.profilePictureUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.editedUserData.profilePictureUrl);
    }
    this.selectedAvatarFile = null;
  }

  handleSave() {
    this.userService.updateUser(this.editedUserData).subscribe({
      next: () => {
        if (this.selectedAvatarFile) {
          const formData = new FormData();
          formData.append('file', this.selectedAvatarFile);
          this.userService.uploadAvatar(formData).subscribe(() => {
            if (this.editedUserData.profilePictureUrl.startsWith('blob:')) {
              URL.revokeObjectURL(this.editedUserData.profilePictureUrl);
            }
          });
        }
        this.isEditing = false;
        this.selectedAvatarFile = null;
      },
      error: err => console.error('Erreur lors de la sauvegarde :', err)
    });
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      console.error('Type de fichier non supporté');
      return;
    }

    if (this.editedUserData.profilePictureUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.editedUserData.profilePictureUrl);
    }

    this.editedUserData.profilePictureUrl = URL.createObjectURL(file);
    this.selectedAvatarFile = file;
  }


  get initials(): string {
    const fullName = `${this.userData.firstName} ${this.userData.lastName}`;
    return fullName
      .split(' ')
      .map(w => w[0]?.toUpperCase())
      .join('');
  }
}
