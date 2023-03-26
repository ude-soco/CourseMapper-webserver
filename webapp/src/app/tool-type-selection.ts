import { PdfToolType } from './models/Annotations';

export function toolTypeSelection(selectedTool: PdfToolType) {
    if(selectedTool == PdfToolType.DrawBox || selectedTool == PdfToolType.Pin){
      var abolutDiv=document.getElementsByClassName('to-draw-rectangle');
          for (let i = 0; i < abolutDiv.length; i++) {
                let element = abolutDiv[i];
                  element.setAttribute('style', 'position: absolute; inset:0px; cursor:crosshair');
        }
    }else if(selectedTool== PdfToolType.Highlight){
      var abolutDiv=document.getElementsByClassName('to-draw-rectangle');
      for (let i = 0; i < abolutDiv.length; i++) {
            let element = abolutDiv[i];
           
            element.removeAttribute('position')
              element.setAttribute('style', 'inset:0px; ; cursor:default');
             
      }
    }else{
      var abolutDiv=document.getElementsByClassName('to-draw-rectangle');
      for (let i = 0; i < abolutDiv.length; i++) {
            let element = abolutDiv[i];
           
            element.removeAttribute('position')
              element.setAttribute('style', ' cursor:auto');
             
      }
    }
  }
