import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'highlight',
})
export class HighlightPipe implements PipeTransform {
  transform(value: string, query: string): string {
    if (!query || query === '') {
      return value;
    }

    // Use a regular expression to find and replace the matched characters
    const regex = new RegExp(query, 'gi');
    return value.replace(
      regex,
      (match) => `<span class="highlight">${match}</span>`
    );
  }
}
