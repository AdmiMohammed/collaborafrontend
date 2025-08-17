export interface Notification {
  id: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  notificationType: { value: 'Comment' | 'Assignment' | 'Unassignment' };
  relatedEntityType?: { value: 'Task' | 'Project' | string };
  relatedEntityId?: number;
}