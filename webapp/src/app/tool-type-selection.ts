import { PdfToolType } from './models/Annotations';

export function toolTypeSelection(selectedTool: PdfToolType) {
  if (selectedTool === PdfToolType.Highlight) {
    var abolutDiv = document.getElementsByClassName('to-draw-rectangle');
    for (let i = 0; i < abolutDiv.length; i++) {
      let element = abolutDiv[i];

      element.removeAttribute('position');
      element.setAttribute('style', 'inset:0px; ; cursor:default');
    }
  }
}
