import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-filter-select',
  templateUrl: './filter-select.component.html',
  styleUrls: ['./filter-select.component.css']
})
export class FilterSelectComponent {
  @Input() label?: string;
  @Input() options: FilterOption[] = [];
  @Input() placeholder = 'Sélectionner…';
  @Input() multiple = false;
  @Input() clearable = true;
  @Input() value: string | string[] | null = null;

  @Output() valueChange = new EventEmitter<string | string[] | null>();

  isOpen = false;
  query = '';

  toggleOpen(): void {
    this.isOpen = !this.isOpen;
  }

  clear(): void {
    this.value = this.multiple ? [] : null;
    this.valueChange.emit(this.value);
  }

  isSelected(v: string): boolean {
    if (this.multiple && Array.isArray(this.value)) {
      return this.value.includes(v);
    }
    return this.value === v;
  }

  selectOption(opt: FilterOption): void {
    if (this.multiple) {
      const arr = Array.isArray(this.value) ? [...this.value] : [];
      const idx = arr.indexOf(opt.value);
      if (idx >= 0) {
        arr.splice(idx, 1);
      } else {
        arr.push(opt.value);
      }
      this.value = arr;
    } else {
      this.value = opt.value;
      this.isOpen = false;
    }
    this.valueChange.emit(this.value);
  }

  removeTag(v: string): void {
    if (this.multiple && Array.isArray(this.value)) {
      this.value = this.value.filter(x => x !== v);
      this.valueChange.emit(this.value);
    }
  }

  get selectedArray(): string[] {
    return Array.isArray(this.value) ? this.value : [];
  }

  get hasMultiSelection(): boolean {
    return this.multiple && this.selectedArray.length > 0;
  }

  labelFor(v: string): string {
    const opt = this.options.find(o => o.value === v);
    return opt ? opt.label : v;
  }

  filtered(): FilterOption[] {
    const q = this.query.toLowerCase();
    return this.options.filter(o => o.label.toLowerCase().includes(q));
  }

  viewLabel(): string | null {
    if (this.multiple) return null;
    const opt = this.options.find(o => o.value === this.value);
    return opt ? opt.label : null;
  }
}
