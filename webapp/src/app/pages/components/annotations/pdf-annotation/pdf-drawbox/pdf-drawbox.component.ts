import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { DrawingTool } from 'src/app/models/Drawing';

@Component({
  selector: 'app-pdf-drawbox',
  templateUrl: './pdf-drawbox.component.html',
  styleUrls: ['./pdf-drawbox.component.css']
})
export class PdfDrawboxComponent implements OnInit {

  @Output() selectedDrawingFormEvent: EventEmitter<string> = new EventEmitter();
  @Output() selectedlineHeightEvent: EventEmitter<number> = new EventEmitter();
  @Output() hideDrawboxOptionsEvent: EventEmitter<boolean> = new EventEmitter();
  currentTool: DrawingTool = "rectangle";
  currentColor: string = "RGB(238,170,0, .25)";
  currentWidth: number = 3;
  constructor() { }

  ngOnInit(): void {
    this.selectedDrawingFormEvent.emit("rectangle")
  }
  onRectangleSelect(){
    this.selectedDrawingFormEvent.emit("rectangle")
    this.currentTool="rectangle"
  }
  onCircleSelect(){
    this.selectedDrawingFormEvent.emit("circle")
    this.currentTool="circle"
  }
  onLineHeightSelect(event: any){
    this.currentWidth=event
    this.selectedlineHeightEvent.emit(event)
  }
  hideDrawboxOptions(){
    this.hideDrawboxOptionsEvent.emit(true)
  }

}
