import { Component, ElementRef, EventEmitter, HostListener, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, forkJoin, of, Subscription} from 'rxjs';
import { Project, Task } from 'src/app/models/project';
import { MenuStateService } from 'src/app/services/menu-state-service/menu-state.service';
import { ProjectMemberDto, ProjectService } from 'src/app/services/project-service/project.service';
import { AppUser } from 'src/app/services/user-service/user1.service';
import { User1Service } from 'src/app/services/user-service/user1.service';

@Component({
  selector: 'app-board-header',
  templateUrl: './board-header.component.html',
  styleUrls: ['./board-header.component.css']
})
export class BoardHeaderComponent {
  @Input() project!: Project;
  currentModal: 'history' | 'archived' | 'addMember' | null = null;
  menuId: string = 'project-header'
  private userSub?: Subscription;
  now = new Date();
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  formattedDate = this.now.toLocaleDateString(undefined, this.options);
  currentUserRole!: string | null;
  isEditingName = false;
  editedName: string = "";
  @Output() taskRestored = new EventEmitter<Task>();
  @Output() columnRestored = new EventEmitter<number>();
  @ViewChild('projectInput') projectInput!: ElementRef;
  constructor(private projectService: ProjectService, private router: Router, private userService: User1Service, private elRef: ElementRef, private menuState: MenuStateService) {}

  toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    if (this.menuState.isOpen(this.menuId)) {
      this.menuState.close(this.menuId);
    } else {
      this.menuState.open(this.menuId);
    }
  }

  get isOpen(): boolean {
    return this.menuState.isOpen(this.menuId);
  }

  async deleteProject() {
    await firstValueFrom(
      this.projectService.deleteProject(this.project.id)
    )
    return this.router.navigate(['/dashboard'])
  }
  openModal(type: 'history' | 'archived' | 'addMember') {
  this.currentModal = type;
  this.menuState.close(this.menuId)
}
  closeModal() {
    this.currentModal = null;
  }

  onMemberChangesConfirmed(event: {
    newMembers: AppUser[];
    removedMembers: ProjectMemberDto[]
  }) {
    const { newMembers, removedMembers } = event;

    const addPayload = newMembers.map(user => ({ userId: user.id }))

    const removePayload = removedMembers.map(member => member.userId)

    const addRequest$ = addPayload.length ? this.projectService.bulkAddMembers(this.project.id, addPayload) : of(null)

    const removeRequest$ = removePayload.length ? this.projectService.bulkRemoveMembers(this.project.id, removePayload) : of(null)

    forkJoin([addRequest$, removeRequest$]).subscribe({
      next: () => {
        this.project.members = [
          ...this.project.members.filter(m => !removePayload.includes(m.userId)),

          ...newMembers.map(m => ({
            userId: m.id,
            profilePictureUrl: m.profilePictureUrl,
            fullName: `${m.firstName} ${m.lastName}`,
            email: m.email,
            role: "Member"
          }))
        ]
      }
    })
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['project'] && this.project) {
      this.setCurrentUserRole();
    }
  }
  setCurrentUserRole() {
    this.userSub = this.userService.getCurrentUser().subscribe(user => {
    const member = this.project.members.find(m => m.userId === user.id);
    this.currentUserRole = member ? member.role : null;
  });
  }
  ngOnDestroy() {
    this.userSub?.unsubscribe();
  }
  renameProjectInline() {
    this.editedName = this.project.name;
    this.isEditingName = true;
    this.focusInput();
    this.menuState.close(this.menuId)
  }

  async saveProjectName() {
    if (!this.editedName || this.editedName.trim() === this.project.name) {
      this.isEditingName = false;
      return;
    }
    try {
      const updatedProject = await firstValueFrom(
        this.projectService.updateProjectName(
          this.editedName.trim(),
          this.project.id
        )
      );
      const trimmed = this.editedName.trim();
  
      this.project.name = trimmed;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du nom du projet', error);
    } finally {
      this.isEditingName = false;
    }
  }

  ngAfterViewInit() {
    if (this.isEditingName && this.projectInput) {
      this.focusInput();
    }
  }
  cancelEdit() {
    this.isEditingName = false;
    this.editedName = '';
  }
  private focusInput() {
    setTimeout(() => this.projectInput?.nativeElement.focus(), 0);
  }

  @ViewChild('menuContainer') menuContainer!: ElementRef;
  @ViewChild('menuIcon') menuIcon!: ElementRef;
 @HostListener('document:mousedown', ['$event'])
  onClickOutside(event: Event) {
    const clickedInsideMenu = this.menuContainer?.nativeElement.contains(event.target);
    const clickedOnIcon = this.menuIcon?.nativeElement.contains(event.target);
    if (this.isOpen && !clickedInsideMenu && !clickedOnIcon) {
      this.menuState.close(this.menuId)
    }
  }
}