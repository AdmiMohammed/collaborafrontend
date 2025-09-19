import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlightName'
})
export class HighlightNamePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';

    const words = value.split(' ');
    if (words.length < 2) return value;

    const firstName = words[0];
    const lastName = words[1];

    const formattedFirst = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    const formattedLast = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();

    const highlighted = `<span class="font-semibold text-[#16306B]">${formattedFirst} ${formattedLast}</span> ${words.slice(2).join(' ')}`;

    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }
}
