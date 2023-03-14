import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { Drawing, DrawingData, DrawingTool } from 'src/app/models/Drawing';
import { paintDrawing } from 'src/app/_helpers/canvas';
import { calculateMousePositionInVideo } from 'src/app/_helpers/video-helper';
import { State } from '../state/video.reducer';
import * as VideoActions from '../state/video.action'

type EditingAction = "draw" | "move" | "points" | "delete";

@Component({
  selector: 'app-video-drawing-overlay',
  templateUrl: './video-drawing-overlay.component.html',
  styleUrls: ['./video-drawing-overlay.component.css']
})
export class VideoDrawingOverlayComponent {
  drawingData: DrawingData = { drawings: [] };
  currentDrawing?: Drawing;
  isMouseDown: boolean = false;
  lastVertexReadingTime: number = 0;
  ctx?: CanvasRenderingContext2D;
  currentAction: EditingAction = "draw";
  currentTool: DrawingTool = "brush";
  currentColor: string = "#000000";
  currentWidth: number = 3;
  selectedVertex?: {drawingIndex: number, vertexIndex: number};

  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>;

  @Input() boundingRect?: DOMRect;
  @Input() videoWidth?: number;
  @Input() videoHeight?: number;

  @Output() drawingChanged: EventEmitter<DrawingData> = new EventEmitter();
  @Output() cancelSelection: EventEmitter<void> = new EventEmitter();
  @Output() doneDrawing: EventEmitter<void> = new EventEmitter();

  constructor(private store: Store<State>){}

  ngOnInit(): void {
    this.drawingChanged.emit(this.drawingData);
  }

  setAction(action: EditingAction) {
    this.selectedVertex = undefined;
    this.currentAction = action;
    this.repaintCanvas();
  }

  mouseDown(event: MouseEvent) {
    if (!this.boundingRect || !this.videoWidth || !this.videoHeight) return;

    const {isInsideVideo, xRatio, yRatio} = calculateMousePositionInVideo(
      event.clientX,
      event.clientY,
      this.boundingRect,
      this.videoWidth,
      this.videoHeight,
    );

    if (!isInsideVideo) return;

    switch (this.currentAction) {
      case "draw":
        this.currentDrawing = {
          tool: this.currentTool,
          color: this.currentColor,
          width: this.currentWidth,
          vertices: [{ xRatio: xRatio, yRatio: yRatio }]
        };
        break;

      case "move":
        this.selectedVertex = this.getVertexInPosition(xRatio, yRatio);
        break;

      case "points":
        this.selectedVertex = this.getVertexInPosition(xRatio, yRatio);
        break;

      case "delete":
        const selectedVertex = this.getVertexInPosition(xRatio, yRatio);
        if (selectedVertex) {
          const confirmation = window.confirm("Are you sure you wish to delete this drawing?");
          if (confirmation) {
            this.drawingData.drawings.splice(selectedVertex.drawingIndex, 1);
            this.repaintCanvas();
          }
        }
        break;
    }

    this.ctx = this.canvas?.nativeElement.getContext("2d") || undefined;
    this.isMouseDown = true;
  }

  getVertexInPosition(xRatio: number, yRatio: number) {
    for (let i = this.drawingData.drawings.length - 1; i >= 0; i--) {
      const drawing = this.drawingData.drawings[i];

      for (let j = drawing.vertices.length - 1; j >= 0; j--) {
        const vertex = drawing.vertices[j];
        const dx = xRatio - vertex.xRatio, dy = yRatio - vertex.yRatio;

        if (dx * dx + dy * dy < 0.0001) {
          return {
            drawingIndex: i,
            vertexIndex: j
          };
        }
      }
    }

    return undefined;
  }

  mouseUp(event: MouseEvent) {
    this.selectedVertex = undefined;
    this.isMouseDown = false;

    if (!this.currentDrawing) return;

    if (this.currentDrawing?.vertices) this.drawingData.drawings.push(this.currentDrawing);

    this.currentDrawing = undefined;

    this.drawingChanged.emit(this.drawingData);
  }

  mouseMove(event: MouseEvent) {
    if (!this.isMouseDown) return;

    const currentTime = Date.now();

    if (currentTime - this.lastVertexReadingTime < 50) return;

    if (!this.boundingRect || !this.videoWidth || !this.videoHeight) return;



    const {isInsideVideo, xRatio, yRatio} = calculateMousePositionInVideo(
      event.clientX,
      event.clientY,
      this.boundingRect,
      this.videoWidth,
      this.videoHeight,
    );


    if (!isInsideVideo) return;

    switch (this.currentAction) {
      case "draw":
        if (this.currentDrawing) {
          switch (this.currentTool) {
            case "brush":
              this.currentDrawing.vertices.push({ xRatio: xRatio, yRatio: yRatio });
              break;

            case "line":
            case "rectangle":
            case "circle":
            case "arrow":
              this.currentDrawing.vertices = this.currentDrawing.vertices.slice(0, 1);
              this.currentDrawing.vertices.push({ xRatio: xRatio, yRatio: yRatio });
              break;
          }
        }
        break;

      case "move":
        if (this.selectedVertex) {
          const selectedDrawing = this.drawingData.drawings[this.selectedVertex.drawingIndex],
                selectedVertex = selectedDrawing.vertices[this.selectedVertex.vertexIndex];

          const dx = selectedVertex.xRatio - xRatio,
                dy = selectedVertex.yRatio - yRatio;

          for (let i = 0; i < selectedDrawing.vertices.length; i++) {
            this.drawingData.drawings[this.selectedVertex.drawingIndex].vertices[i] = {
              xRatio: this.drawingData.drawings[this.selectedVertex.drawingIndex].vertices[i].xRatio - dx,
              yRatio: this.drawingData.drawings[this.selectedVertex.drawingIndex].vertices[i].yRatio - dy
            };
          }
        }
        break;

      case "points":
        if (this.selectedVertex) {
          this.drawingData.drawings[this.selectedVertex.drawingIndex].vertices[this.selectedVertex.vertexIndex] = {
            xRatio, yRatio
          };
        }
        break;
    }

    this.repaintCanvas();

    this.lastVertexReadingTime = currentTime;
  }

  repaintCanvas() {
    const actualHeight = Math.min(700, (this.boundingRect?.height || 0));
    const zoomRatio = (this.videoHeight || 0) / (actualHeight || 1);
    const actualWidth = (this.videoWidth || 0) / (zoomRatio || 1);

    const startX = ((this.boundingRect?.width || 0) - (actualWidth || 0)) / 2;

    if (!this.ctx || !this.boundingRect) return;

    this.ctx.clearRect(0, 0, this.canvas?.nativeElement.width || 0, this.canvas?.nativeElement.height || 0);

    const allDrawings = [...this.drawingData.drawings];

    if (this.currentDrawing) allDrawings.push(this.currentDrawing);

    for (const drawing of allDrawings) {
      paintDrawing(drawing, this.ctx, startX, this.boundingRect);

      if (this.currentAction == "move" || this.currentAction == "points" || this.currentAction == "delete") {
          this.ctx.lineWidth = 2;
          this.ctx.strokeStyle = "#fff";
  
          for (const vertex of drawing.vertices) {
            this.ctx.beginPath();
          const x = ((this.boundingRect?.width || 0) - startX * 2) * vertex.xRatio + startX;
          const y = (this.boundingRect?.height || 0) * vertex.yRatio;
  
          this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
          this.ctx.stroke();
        }
      }
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: any) {
    if (event?.key == "Escape") {
      this.onCancelButtonClicked();
    }
  }

  onCancelButtonClicked() {
    this.cancelSelection.emit();
  }

  onDoneButtonClicked() {
    this.doneDrawing.emit();
  }
}
