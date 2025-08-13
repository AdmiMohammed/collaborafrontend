// src/app/core/services/templates.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TemplateReadDto {
  id: number;
  name: string;
  description?: string | null;
  isSystemTemplate: boolean;
  boards: string[];
}

@Injectable({ providedIn: 'root' })
export class TemplatesService {
  private apiBase = 'http://localhost:5205/api/ProjectTemplates';

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
