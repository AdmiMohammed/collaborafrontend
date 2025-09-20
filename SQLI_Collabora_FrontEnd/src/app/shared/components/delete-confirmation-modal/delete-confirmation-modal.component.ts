import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-delete-confirmation-modal',
  templateUrl: './delete-confirmation-modal.component.html',
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
export class DeleteConfirmationModalComponent {
  @Input() itemName: string = 'cet élément';
  @Input() type: string = '';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  deletionLabels: Record<string, string> = {
    'project': 'le projet',
    'task': 'la tâche',
    'column': 'la colonne'
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
