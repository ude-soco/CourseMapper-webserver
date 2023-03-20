import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { Annotation, VideoAnnotationLocation, VideoPinTool } from 'src/app/models/Annotations';
import { isPointInDrawing, isPointInPin, paintDrawing, paintPin } from 'src/app/_helpers/canvas';
import { calculateMousePositionInVideo } from 'src/app/_helpers/video-helper';
import { getAnnotationsForMaterial } from '../../pdf-annotation/state/annotation.reducer';
import { getActiveAnnotation, getCurrentTime, State } from '../state/video.reducer';

@Component({
  selector: 'app-video-rendering-overlay',
  templateUrl: './video-rendering-overlay.component.html',
  styleUrls: ['./video-rendering-overlay.component.css']
})
export class VideoRenderingOverlayComponent implements AfterViewChecked {
  @Input() cursorPositionInVideo?: [number, number];
  @Input() cursorPosition?: [number, number];
  @Input() boundingRect?: DOMRect;
  @Input() videoWidth?: number;
  @Input() videoHeight?: number;

  @Output() playVideo: EventEmitter<void> = new EventEmitter();
  @Output() pauseVideo: EventEmitter<void> = new EventEmitter();
  @Output() seekVideo: EventEmitter<number> = new EventEmitter();

  currentTime: number = 0;
  allAnnotations: Annotation[] = [];
  videoTimeSubscription: Subscription | undefined;
  annotationsSubscription: Subscription | undefined;
  activeAnnotationsSubscription: Subscription | undefined;
  videoBoundingRect?: DOMRect;
  hoveredAnnotations: Annotation[] = [];
  activeAnnotations: Annotation[] = [];
  activeAnnotationPosition?: [number, number];

  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('RenderingArea') RenderingArea: ElementRef<HTMLDivElement>;

  constructor(private store: Store<State>, private changeDetectorRef: ChangeDetectorRef) {
    this.annotationsSubscription = this.store.select(getAnnotationsForMaterial).subscribe((annotations) => {
      this.allAnnotations = annotations;
      this.repaintCanvas();
    });

    this.videoTimeSubscription = this.store.select(getCurrentTime).subscribe((time) => {
      this.currentTime = time;
      this.repaintCanvas();
    });

    this.activeAnnotationsSubscription = this.store.select(getActiveAnnotation).subscribe((annotation) => {
      this.activeAnnotations = [];

      if (annotation && annotation.tool.type != "annotation") {
        this.activeAnnotations.push(annotation);
      }

      if (this.activeAnnotations.length > 0) {
        const annotation = this.activeAnnotations[0];

        // TODO move to own function
        this.videoBoundingRect = this.boundingRect;
        const videoHeight = this.videoHeight;
        const videoWidth = this.videoWidth;
        const actualHeight = Math.min(700, (this.videoBoundingRect?.height || 0));
        const zoomRatio = (videoHeight || 0) / (actualHeight || 1);
        const actualWidth = (videoWidth || 0) / (zoomRatio || 1);
        const startX = ((this.videoBoundingRect?.width || 0) - (actualWidth || 0)) / 2;

        if (annotation.tool.type == "pin") {
          const x = ((this.videoBoundingRect?.width || 0) - startX * 2) * annotation.tool.x + startX;
          const y = (this.videoBoundingRect?.height || 0) * annotation.tool.y;
          this.activeAnnotationPosition = [x, y];
        } else if (annotation.tool.type == "brush") {
          // TODO find center of all drawings
          const x = ((this.videoBoundingRect?.width || 0) - startX * 2) * annotation.tool.data.drawings[0].vertices[0].xRatio + startX;
          const y = (this.videoBoundingRect?.height || 0) * annotation.tool.data.drawings[0].vertices[0].yRatio;
          this.activeAnnotationPosition = [x, y];
        }

        this.pauseVideo.emit();
        if (annotation.location.type == "time" && annotation.location.from >= 0) {
          this.seekVideo.emit(annotation.location.from);
        }
        this.repaintCanvas();
      }
    });
  }

  ngOnInit(): void {
    this.closeAnnotation();
    // this.addMouseMoveEventListener();
  }

  ngAfterViewChecked(): void {
    // console.log(this.cursorPosition, this.cursorPositionInVideo);
    if(this.videoBoundingRect !== this.boundingRect){
      this.videoBoundingRect = this.boundingRect
      this.changeDetectorRef.detectChanges();
      this.repaintCanvas();
    }
  }

  ngOnDestroy(): void {
    this.videoTimeSubscription?.unsubscribe();
    this.annotationsSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['cursorPositionInVideo'] && changes['cursorPositionInVideo'].currentValue != changes['cursorPositionInVideo'].previousValue) {
      this.cursorPositionChanged(changes['cursorPositionInVideo'].currentValue as [number, number]);
    }
  }

  repaintCanvas() {
    const ctx = this.canvas?.nativeElement.getContext("2d");
    this.videoBoundingRect = this.boundingRect;

    if (!ctx || !this.videoBoundingRect) return;

    const videoHeight = this.videoHeight;
    const videoWidth = this.videoWidth;

    const actualHeight = Math.min(700, (this.videoBoundingRect?.height || 0));
    const zoomRatio = (videoHeight || 0) / (actualHeight || 1);
    const actualWidth = (videoWidth || 0) / (zoomRatio || 1);

    const startX = ((this.videoBoundingRect?.width || 0) - (actualWidth || 0)) / 2;

    ctx.clearRect(0, 0, this.canvas?.nativeElement.width || 0, this.canvas?.nativeElement.height || 0);

    if (zoomRatio == 0) return;

    for (const annotation of this.allAnnotations) {
      if ((annotation.location as VideoAnnotationLocation).from >= 0 &&
          ((annotation.location as VideoAnnotationLocation).from > this.currentTime || (annotation.location as VideoAnnotationLocation).to < this.currentTime)) {
        continue;
      }

      this.drawAnnotation(annotation, ctx, startX, this.videoBoundingRect);
    }

    if (this.activeAnnotations.length > 0) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, this.canvas?.nativeElement.width || 0, this.canvas?.nativeElement.height || 0);

      for (const annotation of this.activeAnnotations) {
        this.drawAnnotation(annotation, ctx, startX, this.videoBoundingRect);
      }
    }
  }

  drawAnnotation(annotation: Annotation, ctx: CanvasRenderingContext2D, startX: number, videoBoundingRect: DOMRect) {
    switch (annotation.tool.type) {
      case "brush":
        for (const drawing of annotation.tool.data.drawings) {
          paintDrawing(drawing, ctx, startX, videoBoundingRect);
        }
        break;
      
      case "pin":
        paintPin((annotation.tool as VideoPinTool).x, (annotation.tool as VideoPinTool).y, ctx, startX, videoBoundingRect);
        break;
    }
  }

  cursorPositionChanged(newPosition: [number, number]) {
    if (!newPosition) return;

    const ctx = this.canvas?.nativeElement.getContext("2d");
    this.videoBoundingRect = this.boundingRect;

    if (!ctx || !this.videoBoundingRect) return;

    const videoHeight = this.videoHeight;
    const videoWidth = this.videoWidth;

    const actualHeight = Math.min(700, (this.videoBoundingRect?.height || 0));
    const zoomRatio = (videoHeight || 0) / (actualHeight || 1);
    const actualWidth = (videoWidth || 0) / (zoomRatio || 1);

    const startX = ((this.videoBoundingRect?.width || 0) - (actualWidth || 0)) / 2;

    if (zoomRatio == 0) return;

    let hoveredAnnotations = new Set<Annotation>();

    for (const annotation of this.allAnnotations) {
      if ((annotation.location as VideoAnnotationLocation).from >= 0 &&
          ((annotation.location as VideoAnnotationLocation).from > this.currentTime || (annotation.location as VideoAnnotationLocation).to < this.currentTime)) {
        continue;
      }

      switch (annotation.tool.type) {
        case "brush":
          for (const drawing of annotation.tool.data.drawings) {
            if (isPointInDrawing(newPosition[0], newPosition[1], drawing, startX, this.videoBoundingRect)) {
              hoveredAnnotations.add(annotation);
              console.log('brush');
            }
          }
          break;
        
        case "pin":
          if (isPointInPin(newPosition[0], newPosition[1], (annotation.tool as VideoPinTool).x, (annotation.tool as VideoPinTool).y, startX, this.videoBoundingRect)) {
            hoveredAnnotations.add(annotation);
            console.log('pin');
          }
          break;
      }
    }

    this.hoveredAnnotations = [...hoveredAnnotations];
  }

  hoveredAnnotationClicked() {
    if (this.hoveredAnnotations.length == 0) return;

    this.activeAnnotations = this.hoveredAnnotations;
    this.activeAnnotationPosition = this.cursorPosition;
    this.pauseVideo.emit();
    this.repaintCanvas();
  }

  activeAnnotationClicked(id: string) {
    var noHashURL = window.location.href.replace(/#.*$/, '');
    window.history.replaceState('', document.title, noHashURL);

    setTimeout(() => {
      if (this.activeAnnotations.length == 0) return;

      window.location.hash = "#annotation-" + id;

      this.closeAnnotation();
    }, 10);
  }

  closeAnnotation() {
    this.activeAnnotations = [];
    this.repaintCanvas();
  }

  mouseMovedOnVideo(event: MouseEvent) {
    console.log(event.clientX, event.clientY);
    const boundingRect = this.boundingRect;


    if (!this.videoWidth || !this.videoHeight || !boundingRect) return;

    const {isInsideVideo, xRatio, yRatio, xPosition, yPosition} = calculateMousePositionInVideo(
      event.clientX,
      event.clientY,
      boundingRect,
      this.videoWidth,
      this.videoHeight,
    );

    if (!isInsideVideo) {
      this.cursorPositionInVideo = undefined;
      this.cursorPosition = undefined;
      return;
    }

    this.cursorPositionInVideo = [xRatio, yRatio];
    this.cursorPosition = [xPosition, yPosition];
  }

  addMouseMoveEventListener() {
    // create an overlay element that covers the player element
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'red';
    overlay.style.pointerEvents = 'auto'
    overlay.style.zIndex = '1';


    // add the overlay element to the video container
    const videoContainer = document.querySelector('.canvas');
    videoContainer.appendChild(overlay);


    // add a mousemove listener to the child element
    videoContainer.addEventListener('mousemove', this.mouseMovedOnVideo.bind(this));
  }
}
