import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'initials'
})
export class InitialsPipe implements PipeTransform {

  transform(value: string): string {
    if (!value) return '';
    const parts = value.split(' ');
    const firstInitial = parts[0]?.charAt(0) || '';
    const lastInitial = parts[1]?.charAt(0) || '';

    return `${firstInitial}${lastInitial}`;
  }

}
