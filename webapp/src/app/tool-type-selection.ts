export function toolTypeSelection(selectedTool:any){
if(selectedTool=="highlightTool"){
        var abolutDiv=document.getElementsByClassName('to-draw-rectangle');
        for (let i = 0; i < abolutDiv.length; i++) {
              let element = abolutDiv[i];
             
              element.removeAttribute('position')
                element.setAttribute('style', 'inset:0px; ; cursor:default');
               
        }
      }
}