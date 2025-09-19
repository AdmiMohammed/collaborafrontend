import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, forkJoin, of, switchMap } from 'rxjs';
import { Project, ProjectMemberDto } from 'src/app/models/project';
import {  ProjectService } from 'src/app/services/project-service/project.service';
import { AppUser } from 'src/app/services/user-service/user1.service';
import { User1Service } from 'src/app/services/user-service/user1.service';

@Component({
  selector: 'app-board-header',
  templateUrl: './board-header.component.html',
  styleUrls: ['./board-header.component.css']
})
export class BoardHeaderComponent {
  @Input() project!: Project;

  now = new Date();
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  formattedDate = this.now.toLocaleDateString(undefined, this.options);

  //options menu
  menuOpen: boolean = false;
  menuLeft = 0; // pixels offset from left of viewport

  router: Router
  projectService: ProjectService
  userService: User1Service

  //modal 
  showAddMemberModal = false;

  currentUserRole!: string | null;

  constructor(projectService: ProjectService, router: Router, userService: User1Service) {
    this.router = router;
    this.projectService = projectService;
    this.userService = userService;
  }

  ToggleMenu(event: MouseEvent) {
    event.stopPropagation();
    console.log("clicked")
    console.log(this.menuOpen)
    if (!this.menuOpen) {
      event.stopPropagation(); // Prevents click from bubbling up

      const button = event.currentTarget as HTMLElement;
      const parent = button.parentElement!; // The .relative container
      const parentRect = parent.getBoundingClientRect(); // Position of parent in viewport
      const buttonRect = button.getBoundingClientRect(); // Position of button in viewport
      const screenWidth = window.innerWidth;

      const dropdownWidth = 224; // Tailwind w-56 = 14rem = 224px

      // Initial left offset: how far the button's right edge overflows the parent
      let overflowRight = buttonRect.right - parentRect.right;

      // If dropdown would overflow the screen, shift it left
      if (buttonRect.right + dropdownWidth > screenWidth) {
        overflowRight -= (buttonRect.right + dropdownWidth - screenWidth + 16); // 16px padding
        if (overflowRight > 0) overflowRight = 0; // Clamp to 0 so it doesn't float too far left
      }


      this.menuLeft = overflowRight; // Final left offset inside parent
    }
    this.menuOpen = !this.menuOpen; // Toggle menu visibility
  }


  // Optional: close on outside click
  ngOnInit() {
    document.addEventListener('click', () => {
      this.menuOpen = false;
    });
  }

  async DeleteProject() {
    await firstValueFrom(
      this.projectService.deleteProject(this.project.id)
    )
    return this.router.navigate(['/dashboard'])
  }

  openModal() {
    this.showAddMemberModal = true;
    // Prevent body scroll and compensate for scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
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
    this.userService.getCurrentUser().subscribe(user => {
      const member = this.project.members.find(m => m.userId === user.id);
      this.currentUserRole = member ? member.role : null;
    });
  }
}
