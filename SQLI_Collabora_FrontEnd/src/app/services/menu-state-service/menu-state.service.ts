import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuStateService {

  private activeMenu = new BehaviorSubject<string | null>(null);

  activeMenu$ = this.activeMenu.asObservable();

  open(menuId: string) {
    this.activeMenu.next(menuId);
  }

  close(menuId: string) {
    if (this.activeMenu.value === menuId) {
      this.activeMenu.next(null);
    }
  }

  isOpen(menuId: string): boolean {
    return this.activeMenu.value === menuId;
  }
}
