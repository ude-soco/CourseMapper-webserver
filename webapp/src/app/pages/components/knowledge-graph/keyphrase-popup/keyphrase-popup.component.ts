import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-keyphrase-popup',
  templateUrl: './keyphrase-popup.component.html',
  styleUrls: ['./keyphrase-popup.component.scss']
})
export class KeyphrasePopupComponent {
  @Input() visible = false;
  @Input() keyphrase = '';
  @Input() position = { x: 0, y: 0 };

  close() {
    this.visible = false;
  }
}
