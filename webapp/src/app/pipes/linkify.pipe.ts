import {Pipe, PipeTransform, SecurityContext} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';

@Pipe({
  name: 'linkify'
})
export class LinkifyPipe implements PipeTransform {
  constructor(private domSanitizer: DomSanitizer) {}

  transform(value: any, args?: any): any {
    return this.domSanitizer.sanitize(SecurityContext.HTML, this.stylize(value));
  }

  private stylize(text: string): string {
    let stylizedText = '';
    if (text && text.length > 0) {
      for (const line of text.split('\n')) {
        for (const t of line.split(' ')) {
          if (t.startsWith('http') && t.length > 7) {
            stylizedText += `<a class="italic" style='color:#0377bd' href="${t}" target="_blank">${t}</a> `;
          }
          else {
            stylizedText += t + ' ';
          }
        }
        stylizedText += '<br>';
      }
      return stylizedText;
    } else { return text; }
  }
}
