import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'highlight',
  pure: true, // Ensures the pipe runs only when inputs change (prevents infinite loops)
})
export class HighlightPipe implements PipeTransform {
  transform(text: string, keyphrases: any): string {
    if (!text || !keyphrases || keyphrases.length === 0) {
      return text;
    }

    const escapedKeyphrases = keyphrases.map(([kp]: [string]) =>
      kp.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    );

    const regex = new RegExp(`(${escapedKeyphrases.join('|')})`, 'gi');

    return text.replace(regex, `<span class="highlight-keyphrase">$1</span>`);
  }
}
