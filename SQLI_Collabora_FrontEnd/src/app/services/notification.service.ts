import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Notification } from '../models/notification';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private hubUrl = `http://localhost:5205/notificationHub`;
  private apiUrl = `http://localhost:5205/api/assignment-notifications`;
  private hubConnection!: signalR.HubConnection;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private token: string | null = null;

  constructor(private http: HttpClient) {}

  // Charge les notifications initiales via l'API REST
  loadInitialNotifications(page: number = 1, pageSize: number = 20): void {
    this.getUserNotifications(page, pageSize).subscribe(data => {
      this.notificationsSubject.next(data);
    });
  }

  async startConnection(token: string) {
    this.token = token;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => this.token!
      })
      .build();

    this.hubConnection.onclose(async () => {
      console.log('SignalR déconnecté, tentative de reconnexion...');
      await this.startConnection(this.token!);
    });

    // Écoute l'événement temps réel avant de démarrer la connexion
    this.hubConnection.on('ReceiveNotification', (notification: Notification) => {
      console.log('Notification reçue via SignalR:', notification);
      const current = this.notificationsSubject.getValue();
      this.notificationsSubject.next([notification, ...current]);
    });

    try {
      await this.hubConnection.start();
      console.log('SignalR connecté');
    } catch (err) {
      console.error('Erreur SignalR:', err);
      // Eventuellement essayer une reconnexion après un délai
    }
  }

  getUserNotifications(page: number = 1, pageSize: number = 20): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}?page=${page}&pageSize=${pageSize}`);
  }

  getStats(): Observable<{ totalCount: number, unreadCount: number }> {
    return this.http.get<{ totalCount: number, unreadCount: number }>(`${this.apiUrl}/stats`);
  }

  markAsRead(id: number) {
    return this.http.put(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead() {
    return this.http.put(`${this.apiUrl}/read-all`, {});
  }

  deleteNotification(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
