export interface Notification {
  id: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  notificationType: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
}
