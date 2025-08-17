import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Project } from 'src/app/models/project';
import { ProjectService } from 'src/app/services/project-service/project.service';

@Component({
  selector: 'app-project-page',
  templateUrl: './project-page.component.html',
  styleUrls: ['./project-page.component.css']
})
export class ProjectPageComponent implements OnInit {
  project!: Project;
  addingColumn = false;
  newColumnName = '';

  openMenuColumnId: number | null = null;

  constructor(private projectService: ProjectService,
    private route: ActivatedRoute
  ) { }

  @ViewChild('newColumnInput') newColumnInput!: ElementRef<HTMLInputElement>;

  cancelAddColumn() {
    this.addingColumn = false;
    this.newColumnName = '';
  }

  openAddColumn() {
    this.addingColumn = true;
    this.newColumnName = '';

    // Focus input after view updates
    setTimeout(() => {
      this.newColumnInput?.nativeElement.focus();
    });
  }

  async addColumn() {
    if (!this.newColumnName.trim()) return;

    try {
      // Calculate next position
      const nextPosition = this.project.columns.length > 0
        ? Math.max(...this.project.columns.map(c => c.position ?? 0)) + 1
        : 0;

      const newColumn = await firstValueFrom(
        this.projectService.createColumn({
          name: this.newColumnName,
          projectId: this.project.id,
          position: nextPosition,
        })
      );
      this.project.columns.push(newColumn!);
      this.cancelAddColumn();
    } catch (error) {
      console.error('Failed to add column', error);
      // left error handling for later
    }
  }


  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const projectId = idParam ? +idParam : null; // The unary plus converts string to number
    if (projectId != null) {
      this.projectService.getProjectDetails(projectId).subscribe({
        next: (data) => {
          this.project = data;
          console.log(this.project);
        },
        error: (err) => {
          console.error('Erreur chargement projets :', err);
          //later
        }
      });
    }
    else {
      //left error handling for later
    }
  }

  //column menu

  toggleMenu(columnId: number) {
    console.log(columnId)
    if (this.openMenuColumnId === columnId) {
      this.openMenuColumnId = null; // close if clicking same column again
    } else {
      this.openMenuColumnId = columnId; // open this column, close others
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    console.log(event)
    const target = event.target as HTMLElement;
    this.openMenuColumnId = null;
  }
}
