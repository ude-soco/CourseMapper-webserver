import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'byPassUrlSanitization'
})
export class ByPassUrlSanitizationPipe implements PipeTransform {

  constructor(public sanitizer: DomSanitizer) {}
  transform(url: string): unknown {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

}
