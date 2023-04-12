import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appUpdateBorderColor]'
})
export class UpdateBorderColorDirective implements OnChanges {
  @Input('appUpdateBorderColor') borderColor: string;
  
  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['borderColor'] && this.borderColor !== undefined) {
      // select the child element using querySelector
      const childElement = this.el.nativeElement.querySelector('.p-dropdown');
  
      if (childElement) {
        childElement.style.border = `1px solid ${this.borderColor}`;
      }
    }
  }
}
