import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { DrawingTool } from 'src/app/models/Drawing';
import { showDrawBoxTools, State } from '../state/annotation.reducer';
import * as AnnotationActions from '../state/annotation.actions';
import { Observable } from 'rxjs';

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
  showDrawBoxTools$: Observable<boolean>;
  constructor(private store: Store<State>) { }

  ngOnInit(): void {
    this.showDrawBoxTools$ = this.store.select(showDrawBoxTools);
    this.store.dispatch(AnnotationActions.setSelectedDrawingTool({tool: "rectangle"}));
  }
  onRectangleSelect(){
    this.store.dispatch(AnnotationActions.setSelectedDrawingTool({tool: "rectangle"}));
    this.currentTool="rectangle"
  }
  onCircleSelect(){
    this.store.dispatch(AnnotationActions.setSelectedDrawingTool({tool: "circle"}));
    this.currentTool="circle"
  }
  onLineHeightSelect(width: any){
    this.currentWidth = width
    this.store.dispatch(AnnotationActions.setSelectedDrawingLineHeight({height: width}));
  }
  hideDrawboxOptions(){
    this.hideDrawboxOptionsEvent.emit(true)
  }

}
