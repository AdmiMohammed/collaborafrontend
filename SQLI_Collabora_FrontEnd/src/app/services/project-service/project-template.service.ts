// src/app/core/services/templates.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface TemplateReadDto {
  id: number;
  name: string;
  description?: string | null;
  isSystemTemplate: boolean;
  boards: string[];
}

@Injectable({ providedIn: 'root' })
export class TemplatesService {
  private apiBase = `${environment.apiUrl}/api/ProjectTemplates`;

  constructor(private http: HttpClient) {}

  // Liste pour afficher les cartes + chips des boards
  getAll(): Observable<TemplateReadDto[]> {
    return this.http.get<TemplateReadDto[]>(this.apiBase);
  }

  // (optionnel) détail d’un template
  getById(id: number): Observable<TemplateReadDto> {
    return this.http.get<TemplateReadDto>(`${this.apiBase}/${id}`);
  }
}
