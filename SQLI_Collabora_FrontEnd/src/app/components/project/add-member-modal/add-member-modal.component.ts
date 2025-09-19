import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ProjectMemberDto } from 'src/app/models/project';
import { AppUser, User1Service } from 'src/app/services/user-service/user1.service';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-add-member-modal',
  templateUrl: './add-member-modal.component.html',
  animations: [
    trigger('overlayAnimation', [
    state('void', style({ opacity: 0 })),
    state('*', style({ opacity: 1 })),
    transition('void <=> *', animate('200ms ease-in-out'))
  ]),
  trigger('modalAnimation', [
    state('void', style({ opacity: 0, transform: 'scale(0.95)' })),
    state('*', style({ opacity: 1, transform: 'scale(1)' })),
    transition('void <=> *', animate('200ms ease-in-out')),
  ])
    ]
})
export class AddMemberModalComponent implements OnInit {
  @Input() existingMembers!: ProjectMemberDto[];
  @Output() close = new EventEmitter<void>();
  @Output() memberChangesConfirmed = new EventEmitter<{
    newMembers: AppUser[];
    removedMembers: ProjectMemberDto[];
  }>();
  
  searchQuery = '';
  candidateUsers: AppUser[] = [];
  searchResults: AppUser[] = [];
  focusedIndex = -1;

  existingMembersWithStatus: (ProjectMemberDto & { pendingRemoval?: boolean })[] = [];
  newMembers: AppUser[] = [];

  @ViewChild('searchContainer') searchContainer!: ElementRef;
  dropdownOpen = false;

  constructor(private userService: User1Service) { }

  ngOnInit() {
    this.existingMembersWithStatus = this.existingMembers
      .filter(m => m.role !== "Owner")
      .map(m => ({ ...m, pendingRemoval: false }));
    this.userService.getUsers().subscribe(users => {
      this.candidateUsers = users.filter(
        u => !this.existingMembers.map(m => m.userId).includes(u.id)
      );
      this.searchResults = [];
    });
  }

  onSearchChange() {
    this.focusedIndex = -1;
    const term = this.searchQuery.trim().toLowerCase();

    if (!term) {
      this.searchResults = [];
      this.dropdownOpen = false;
      return;
    }

    this.searchResults = this.candidateUsers
      .filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      )
      .filter(u => !this.newMembers.some(m => m.id === u.id));

    // Always open when there is a query
    this.dropdownOpen = true;
  }

  addNewMember(user: AppUser) {
    this.newMembers.push(user);
    // Remove from  candidateUsers so they don't show again
    this.candidateUsers = this.candidateUsers.filter(u => u.id !== user.id);
    this.searchQuery = '';
    this.searchResults = [];
    this.dropdownOpen = false;
  }

  removeNewMember(user: AppUser) {
    this.newMembers = this.newMembers.filter(m => m.id !== user.id);
    // Put them back into available list
    this.candidateUsers.push(user);
  }

  markForRemoval(member: ProjectMemberDto & { pendingRemoval?: boolean }) {
    member.pendingRemoval = true;
  }

  undoRemoval(member: ProjectMemberDto & { pendingRemoval?: boolean }) {
    member.pendingRemoval = false;
  }

  confirmChanges() {
    const removedMembers = this.existingMembersWithStatus.filter(m => m.pendingRemoval);
    this.memberChangesConfirmed.emit({
      newMembers: this.newMembers,
      removedMembers
    });
    this.closeModal();
  }

  closeModal() {
    this.close.emit();
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.searchResults.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusedIndex = (this.focusedIndex + 1) % this.searchResults.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusedIndex =
        (this.focusedIndex - 1 + this.searchResults.length) % this.searchResults.length;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.focusedIndex >= 0) {
        this.addNewMember(this.searchResults[this.focusedIndex]);
      }
    } else if (event.key === 'Escape') {
      this.searchQuery = '';
    }
  }

  @HostListener('document:mousedown', ['$event'])
  onClickOutside(event: Event) {
    if (this.dropdownOpen && this.searchContainer && !this.searchContainer.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
      this.focusedIndex = -1;
    }
  }
}


