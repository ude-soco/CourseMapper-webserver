import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { PDFDocumentProxy, PdfViewerComponent } from 'ng2-pdf-viewer';
import { toolTypeSelection } from 'src/app/_helpers/tool-type-selection';
import {
  Position,
  Rectangle,
  RectangleObject,
} from 'src/app/models/AnnotationForms';
import {
  Annotation,
  PdfAnnotationTool,
  PdfGeneralAnnotationLocation,
  PdfToolType,
} from 'src/app/models/Annotations';
import {
  getAnnotationsForMaterial,
  getCurrentPdfPage,
  getHideAnnotationValue,
  getIsAnnotationCanceled,
  getIsAnnotationDialogVisible,
  getIsAnnotationPosted,
  getPdfSearchQuery,
  getPdfZoom,
  getSelectedDrawingLineHeight,
  getSelectedDrawingTool,
  getSelectedTool,
  State,
} from '../state/annotation.reducer';
import { Store } from '@ngrx/store';
import {
  getCurrentCourseId,
  getCurrentMaterialId,
} from '../../../materils/state/materials.reducer';
import { PdfviewService } from 'src/app/services/pdfview.service';
import { distinctUntilChanged, filter, first, map, Observable, Subject, Subscription, takeUntil } from 'rxjs';
import { environment } from 'src/environments/environment';
import * as MaterialActions from 'src/app/pages/components/materils/state/materials.actions';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import * as $ from 'jquery';
import { AnnotationType } from 'src/app/models/Annotations';
import { SocketIoModule, SocketIoConfig, Socket } from 'ngx-socket-io';
import { PdfAnnotationSummaryComponent } from '../pdf-annotation-summary/pdf-annotation-summary.component';
import { Reply } from 'src/app/models/Reply';
import { getLoggedInUser } from 'src/app/state/app.reducer';

@Component({
  selector: 'app-pdf-main-annotation',
  templateUrl: './pdf-main-annotation.component.html',
  styleUrls: ['./pdf-main-annotation.component.css'],
})
export class PdfMainAnnotationComponent implements OnInit, OnDestroy {
  // Pdf-View properties
  @ViewChild(PdfViewerComponent, { static: false })
  private pdfComponent!: PdfViewerComponent;
  @ViewChild('annotationSummary', { static: true }) annotationSummary!: PdfAnnotationSummaryComponent;
  matchesFound: any = 0;
  currentPage: number = 1;
  pdfZoom$: Observable<number>;
  totalPages: number;
  docURL!: string;
  subs = new Subscription();
  private API_URL = environment.API_URL;

  // Annotation properties
  drawingRect: Rectangle = {
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    width: 0,
    height: 0,
    borderRadius: 0,
    lineHeight: 0,
  };
  mouseDownFlag: boolean = false;
  drawElement!: any;
  dataPageNumber = 1;
  highlightedElmts: any[] = [];
  showPopup = false;

  //Boolean flags
  isAnnotationDialogVisible$: Observable<boolean>;
  isAnnotationCanceled$: Observable<boolean>;
  isAnnotationPosted$: Observable<boolean>;
  isHideAnnotations$: Observable<boolean>;

  pdfAnnotationToolObject!: PdfAnnotationTool;

  selectedTool!: PdfToolType;
  selectedLineHeight: number = 2;
  annotationToolForm!: string;
  selectedDrawingTool!: string;
  highlightObjectsList: any = [];
  currentUserId: string;
  currentRectId: any
  pinCoords: any;
  pinElement!: any;
  textSelection!: boolean;
  selectedNoteId: any;
  materialId: string;
  courseId: string;
  pagePosition: Position = { x: 0, y: 0 };
  lastMousePosition: Position = { x: 0, y: 0 };
  mousePosition: Position = { x: 0, y: 0 };
  currentPinId: string;
  pinUrl: string = '/assets/icons/PinPoint.svg';
  hideAnnotationEvent: boolean = false;
  pinObjectsList: any = [];
  cursorMode: string = 'default';
  drawBoxObjectList: RectangleObject[] = [];
  annotations: Annotation[] = [];
  ngOnInit(): void {
    this.store.select(getHideAnnotationValue).subscribe((isHideAnnotations) => {
      this.hideAnnotations(isHideAnnotations);
    });

    this.store.select(getCurrentPdfPage).subscribe((currentPage) => {
      this.currentPage = currentPage;
      this.pageRendered(currentPage);
    });
  }

  ngOnDestroy(): void {

  }

  constructor(
    private pdfViewService: PdfviewService,
    private store: Store<State>,
    private socket: Socket
  ) {
    this.getDocUrl();
    this.store.dispatch(AnnotationActions.loadAnnotations());

    this.store.select(getCurrentMaterialId).subscribe((id) => {
      this.materialId = id;
    });

    this.store.select(getCurrentCourseId).subscribe((id) => {
      this.courseId = id;
    });

    this.store.select(getSelectedTool).subscribe((tool) => {
      this.selectedTool = tool;
      toolTypeSelection(tool);
    });

    this.store.select(getSelectedDrawingTool).subscribe((tool) => this.selectedDrawingTool = tool);
    this.store.select(getSelectedDrawingLineHeight).subscribe((height) => this.selectedLineHeight = height);

    this.store.select(getIsAnnotationCanceled).subscribe((isCanceled) => {
      if (isCanceled) {
        this.cancel();
      }
    });

    this.store.select(getPdfSearchQuery).subscribe((PdfQuery) => {
      this.searchQueryChangedNext(PdfQuery);
    });

    this.store.select(getAnnotationsForMaterial).subscribe((annotations) => {
      this.annotations = annotations;
      this.getDrawBoxObjects(this.annotations);
      this.getHighlightObjects(this.annotations);
      this.getPinObjects(this.annotations);
      this.pageRendered(annotations);
    });

    this.pdfZoom$ = this.store.select(getPdfZoom);

    this.isAnnotationDialogVisible$ = this.store.select(
      getIsAnnotationDialogVisible
    );

    this.store.select(getLoggedInUser).subscribe((user) => this.currentUserId = user.id)
    this.isAnnotationCanceled$ = this.store.select(getIsAnnotationCanceled);
    this.isAnnotationPosted$ = this.store.select(getIsAnnotationPosted);

    this.socket.on(this.materialId, (payload: { eventType: string, annotation: Annotation, reply: Reply }) => {
      let annotation = this.annotations.find((anno) => payload.annotation?._id == anno._id)
        this.store.dispatch(AnnotationActions.updateAnnotationsOnSocketEmit({payload: payload}));
    })
  }


  getDocUrl() {
      this.pdfViewService.currentDocURL.subscribe((url) => {
        this.docURL = this.API_URL + url.replace(/\\/g, '/');
      });
  }

  pagechanging(e: any) {
    this.store.dispatch(AnnotationActions.setCurrentPdfPage({pdfCurrentPage: e.first + 1}));
    this.selectedNoteId = null;
  }

  public handlePdfLoaded(pdf: PDFDocumentProxy): void {
    this.totalPages = pdf.numPages;
    this.store.dispatch(AnnotationActions.setPdfTotalPages({pdfTotalPages: this.totalPages}));
    this.currentPage = 1;
    this.pdfViewService.setTotalPages(this.totalPages);
    this.pdfComponent.pdfViewer.currentScaleValue = 'page-fit';
    this.pdfComponent.pdfViewer.eventBus.on(
      'updatefindmatchescount',
      (data: any) => {
        this.matchesFound = data.matchesCount.total;
      }
    );

    this.pdfComponent.pdfViewer.eventBus.on(
      'updatefindcontrolstate',
      (data: any) => {
        if (data.state === 0) {
        }
      }
    );
  }

  getDrawBoxObjects(annotations: Annotation[]) {
    this.drawBoxObjectList = [];
    const drawBoxs = annotations.filter((n: any) => n?.tool?.type === 'drawing');
    if(drawBoxs.length > 0) {
      drawBoxs.forEach((element) => {
        let rect = (element.tool as PdfAnnotationTool).rect
        const updatedElement = {
          ...element,
          tool: { ...element.tool, rect: {...rect, _id: element._id }},
        };
        this.drawBoxObjectList.push(updatedElement.tool.rect);
      });
    }
  }

  getHighlightObjects(annotations: Annotation[]) {
    this.highlightObjectsList = [];
    const highlights = annotations.filter((n) => n.tool.type === 'highlight');
    highlights.forEach((element) => {
      const updatedElement = {
        ...element,
        tool: { ...element.tool, _id: element._id },
      };
      this.highlightObjectsList.push(updatedElement.tool);
    });
  }

  getPinObjects(annotations: Annotation[]) {
    this.pinObjectsList = [];
    const pinNotes = annotations.filter((n) => n.tool.type === 'pinpoint');
    if (pinNotes.length > 0) {
      pinNotes.forEach((element) => {
        const updatedElement = {
          ...element,
          tool: { ...element.tool, _id: element._id },
        };
        this.pinObjectsList.push(updatedElement.tool);
      });
    }
  }

  afterLoadComplete(event: any){
    this.store.dispatch(AnnotationActions.setCurrentPdfPage({pdfCurrentPage: 1}));
  }

    /** Is called when a page is rendered. Is used to add Pin/rectangle/ highlight/circle on the pdf when a page is rendering */
    pageRendered(event: any) {
      //this.pdfComponent.pdfViewer.currentScaleValue = 'page-fit';
      if (this.hideAnnotationEvent == false) {
        this.textSelection = false
        let elem;
        var divToAddAnnotation = Array.from(document.getElementsByClassName('to-draw-rectangle') as HTMLCollectionOf<HTMLElement>)
        if (divToAddAnnotation.length > 0) {
          elem = divToAddAnnotation[0]
        } else {
          elem = document.createElement('div');
          elem.className = 'to-draw-rectangle';
          elem.style.left = 0 + 'px';
          elem.style.top = 0 + 'px';
          elem.style.right = 0 + 'px';
          elem.style.bottom = 0 + 'px';
          elem.style.cursor = this.cursorMode;
        }
  
        //get the parentElement  showallpage is set to true
        //const path = this.composedPath(event.source.div);
  
        //get the parentElement if showallpage is set to false
        const pageIndex = this.currentPage - 1;
        const page = this.pdfComponent?.pdfViewer?.getPageView(pageIndex);
        const parentElement = page?.div
        if (parentElement != undefined) {
          //const eventPath= path!.find((p: { className: string; }) => p.className === 'page')
          const annotationItem = Array.from(document.getElementsByClassName('annotationItem') as HTMLCollectionOf<HTMLElement>)
          //remove all current annotations on pdf when update annotations list
          if (annotationItem.length > 0) {
            for (let i = 0; i < annotationItem.length; i++) {
              let element = annotationItem[i];
              element.remove()
            }
          }
          parentElement.appendChild(elem);
          //get the current data page number if showallpage is set to false
          const dataPageNumber: number = parentElement.getAttribute('data-page-number')
  
          //var page:any = this.pdfComponent.pdfViewer.getPageView(dataPageNumber-1);
  
          $('.textLayer').addClass('disable-textLayer');
          if (this.drawBoxObjectList != null || this.pinObjectsList != null) {
  
            if (this.drawBoxObjectList != null && this.drawBoxObjectList.length > 0) {
  
              //get annotations coordinates from database and draw rectangle/circle on pdf
  
              var rectElemts = this.drawBoxObjectList.filter(f => f.pageNumber == dataPageNumber);
  
              if (typeof rectElemts !== 'undefined' && rectElemts.length > 0) {
                rectElemts.forEach(rectObj => {
  
                  //check if element already exists in Html dom
  
                  const existElmt = document.getElementById('pdfAnnotation-' + rectObj._id)
                  if (existElmt == undefined) {
                    const rect = document.createElement('div');
                    rect.id = 'pdfAnnotation-' + rectObj._id;
                    rect.className = 'annotationItem';
                    rect.style.position = 'absolute';
                    rect.style.border = rectObj.lineHeight.toString() + 'px solid RGB(238,170,0, .5)';
                    rect.style.cursor = 'pointer'
  
                    var x = rectObj.coordinates.x1 * page.scale,
                      y = rectObj.coordinates.y1 * page.scale,
                      width = rectObj.coordinates.width * page.scale,
                      height = rectObj.coordinates.height * page.scale,
                      x2 = x + width,
                      y2 = y + height;
                    var pagePoint = page.viewport.convertToPdfPoint(x, y)
                      .concat(page.viewport.convertToPdfPoint(x2, y2));
  
                    var obj = page.viewport.convertToViewportRectangle(pagePoint);
  
  
                    rect.style.borderRadius = rectObj.coordinates.borderRadius + '%';
                    rect.style.left = obj[0] + 'px';
                    rect.style.top = obj[1] + 'px';
                    rect.style.width = obj[2] - obj[0] + 'px';
                    rect.style.height = obj[3] - obj[1] + 'px';
                    //add eventlistener show single Annotation in Modal
                    rect.addEventListener('click', (e: any) => {
  
                      this.selectedNoteId = rectObj._id
                      this.showNoteInModal(rectObj._id, rect)
                    });
                    // get to-draw-rectangle div and add rectangle
                    parentElement.children[2].appendChild(rect);
                  }
                })
              }
            }
  
            if (this.pinObjectsList != null && this.pinObjectsList.length > 0) {
              const pinElmts = this.pinObjectsList.filter((f: any) => f.page == dataPageNumber)
              if (typeof pinElmts !== 'undefined' && pinElmts.length > 0) {
                //get annotations coordinates from database and add pin on pdf
  
                pinElmts.forEach((pinObj: any) => {
                  //check if element already exists in Html dom
                  const existElmt = document.getElementById('pdfAnnotation-' + pinObj._id)
                  if (existElmt == undefined) {
                    const myPin = new Image();
                    myPin.useMap = this.pinUrl;
                    const img = document.createElement('img')
                    img.className = 'pinIcon'
                    img.className = "annotationItem"
                    img.id = 'pdfAnnotation-' + pinObj._id
                    var top = pinObj.coordinates[0].top
                    var x = top * page.scale,
                      y = pinObj.coordinates[0].left * page.scale,
                      /*  x=top,
                       y= pinObj.coordinates[0].left, */
                      width = 0 * page.scale,
                      height = 0 * page.scale,
                      x2 = x + width,
                      y2 = y + height;
                    var pagePoint = page.viewport.convertToPdfPoint(x, y)
                      .concat(page.viewport.convertToPdfPoint(x2, y2));
                    var obj = page.viewport.convertToViewportRectangle(pagePoint);
                    img.style.top = obj[0] + 'px';
                    img.style.left = obj[1] + 'px';
                    img.style.height = '30px';
                    img.style.width = '30px';
                    img.style.position = 'absolute'
                    img.src = myPin.useMap
                    img.style.cursor = 'pointer'
                    //add eventlistener show single Annotation in Modal
                    img.addEventListener('click', (e: any) => {
                      this.selectedNoteId = pinObj._id
                      this.showNoteInModal(pinObj._id, img)
                    });
                    // get to-draw-rectangle div and add img
                    parentElement.children[2].appendChild(img);
                  }
                })
              }
            }
            //remove position absolute style to enable the text selection in pdf
            elem.style.position = '';
          }
  
  
          if (this.highlightObjectsList != null && this.highlightObjectsList.length > 0) {
            this.textSelection = false
            // get the highlight coordinates from database and highlight the text
  
            const highlightElemt = this.highlightObjectsList.filter((h: any) => (h.page) == dataPageNumber)
            if (highlightElemt !== 'undefined' && highlightElemt.length > 0) {
              highlightElemt.forEach((element: any) => {
                //highlight only text in the cuurent page index so we remove 1 to the pagenumber to get the right index
                this.highlightText({ page: element.page - 1, rectangles: element.coordinates, noteId: element._id })
              });
            }
          }
          this.getselectedToolType(this.selectedTool)
        }
      }
    }

  /** show note in modal after click on annotation in pdf */
  showNoteInModal(noteId: any, element: any) {
    this.annotationSummary.showAnnotationPopOver(noteId, element);
  }

  paginate(event: any) {
    this.currentPage = event.page + 1;
  }

    /** Show/Hide Annotations on pdf */
    hideAnnotations(hideAnnotations: boolean) {
      var annotationItem = Array.from(document.getElementsByClassName('annotationItem') as HTMLCollectionOf<HTMLElement>)
      if (hideAnnotations == true) {
        this.hideAnnotationEvent = true;
        for (let i = 0; i < annotationItem.length; i++) {
          let annotationItemHmlElmt = annotationItem[i];
          annotationItemHmlElmt.remove()
        }
      } else {
  
        this.hideAnnotationEvent = false;
        this.pageRendered(hideAnnotations);
  
      }
  
    }

  mouseEventHandler(event: MouseEvent) {
    if (
      event.type === 'mouseup' ||
      event.type === 'mousemove' ||
      event.type === 'mousedown'
    ) {
      this.highLightAndDrawing(event);
    }
    if (event.type === 'click') this.addPinPointAnnotation(event);
  }

  // Highlight, Drawing and add Pinpoint to Pdf

  //add a pin in pdf
  addPinPointAnnotation(event: MouseEvent) {
    if (this.selectedTool == PdfToolType.Pin) {
      const toDrawRectangle =
        document.getElementsByClassName('to-draw-rectangle');
      const path = this.composedPath(event.target);
      const eventPath = path!.find(
        (p: { className: string }) => p.className === 'page'
      );
      if (typeof eventPath !== 'undefined') {
        // get currentpage number
        this.dataPageNumber = +eventPath.getAttribute('data-page-number');
        var pageIndex = this.currentPage - 1;
        var page = this.pdfComponent.pdfViewer.getPageView(pageIndex);
        var pageRect = page.canvas.getClientRects()[0];
        // const pageOffset = toDrawRectangle[this.dataPageNumber - 1].getBoundingClientRect();
        const pageOffset = toDrawRectangle[0].getBoundingClientRect();
        this.pagePosition = {
          x: pageOffset.left,
          y: pageOffset.top,
        };

        this.lastMousePosition = {
          x: event.clientX - this.pagePosition.x,
          y: event.clientY - this.pagePosition.y,
        };
        //get curentNumber of pin element
        this.currentPinId =
          this.currentUserId +
          (document.getElementsByClassName('pinIcon').length + 1);
        //create img element
        var myPin = new Image();
        myPin.useMap = this.pinUrl;
        var img = document.createElement('img');
        img.className = 'pinIcon';
        img.className = 'annotationItem';
        img.id = 'pinIcon-' + this.currentPinId;
        img.setAttribute('src', myPin.useMap);
        img.setAttribute(
          'style',
          'height:30px; width:30px; position: absolute;' +
            'left:' +
            this.lastMousePosition.x +
            'px; top:' +
            this.lastMousePosition.y +
            'px;'
        );
        this.pinElement = img;
        this.pinCoords = {
          height: 30,
          width: 30,
          left: this.lastMousePosition.x,
          top: this.lastMousePosition.y,
        };

        //add pin icon in div
        //document.getElementsByClassName('to-draw-rectangle')[this.dataPageNumber! - 1].appendChild(img);
        document
          .getElementsByClassName('to-draw-rectangle')[0]
          .appendChild(img);

        //open confirm box
        if (
          this.lastMousePosition.x > 0 &&
          this.lastMousePosition.y > 0 &&
          this.selectedTool == PdfToolType.Pin
        ) {
          this.confirm(this.pinElement);
        }
      }
    }
  }

  /** Get the path for the current page */
  composedPath(el: any): any {
    const path = [];
    while (el) {
      path.push(el);
      if (el.tagName === 'HTML') {
        path.push(document);
        path.push(window);
        return path;
      }
      el = el.parentElement;
    }
  }

  highLightAndDrawing(event: MouseEvent) {
    var borderRadius = 0
    if (!this.showPopup && this.selectedTool != undefined) {
      if (this.selectedTool === PdfToolType.DrawBox) {
        if (this.selectedDrawingTool == 'circle') {
          borderRadius = 50
          this.annotationToolForm = 'circle'
        }
        if (this.selectedDrawingTool == 'rectangle') {
          borderRadius = 0
          this.annotationToolForm = 'rectangle'
        }
      }
      //mouse event drawing on pdf
      if (event.type === 'mousemove' && this.selectedTool === PdfToolType.DrawBox) {
        this.addingDrawedRectOnPage(event, borderRadius)
      }
      if (event.type === 'mousedown' && this.selectedTool === PdfToolType.DrawBox) {
        this.drawingOnPage(event, borderRadius)
      }
      if(event.type === 'mouseup' && this.selectedTool == PdfToolType.DrawBox){
        this.mouseDownFlag = false;
        if (this.drawingRect.height > 0 && this.drawingRect.width > 0) {
          this.confirm(this.drawElement);
        }
      }


    //mouse event to highlight text selection
    if (this.selectedTool == PdfToolType.Highlight && event.type === 'mouseup') {
      this.getSelectedText();
    }
  }
}

  getSelectedText() {
    this.textSelection = true;
    var pageIndex = this.currentPage - 1;
    var page = this.pdfComponent.pdfViewer.getPageView(pageIndex);
    var pageRect = page.canvas.getClientRects()[0];
    let selectionRects = window.getSelection()!.getRangeAt(0).getClientRects();
    //check if text is selected
    if (window.getSelection()?.toString().length! > 0) {
      var viewport = page.viewport;
      var selected = Object.values(selectionRects).map((r: any) => {
        return viewport
          .convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y)
          .concat(
            viewport.convertToPdfPoint(
              r.right - pageRect.x,
              r.bottom - pageRect.y
            )
          );
      });

      //remove duplicates in coordinatates
      var selectedUniqueSet = new Set(selected);
      var selectedUniqueArray = [...selectedUniqueSet];
      this.saveNoteAndCoordsAfterHighlighting({
        page: pageIndex + 1,
        rectangles: selectedUniqueArray,
      });
      if (this.textSelection == true && this.selectedTool == PdfToolType.Highlight) {
        this.confirm(true)
      }
    }
  }

  saveNoteAndCoordsAfterHighlighting(selected: {
    page: any;
    rectangles: any[];
  }) {
    this.pdfAnnotationToolObject = {
      type: PdfToolType['Highlight'],
      color: 'RGB(238,170,0, .25)',
      coordinates: selected.rectangles,
      page: selected.page,
      _id: '',
    };
  }

    // highlighting after text selection
    highlightText(selected: { page: any; rectangles: any[]; noteId?: any }) {
      var pageIndex = selected.page;
  
      if (!this.textSelection) {
        pageIndex = pageIndex
  
      }
      var page = this.pdfComponent.pdfViewer.getPageView(pageIndex);
  
      var pageElement = page.canvas.parentElement;
      var viewport = page.viewport;
      const existHighlight = document.getElementById("pdfAnnotation-" + selected.noteId)
      if (existHighlight == undefined) {
        selected.rectangles.forEach((rect: any, index) => {
          var bounds = viewport.convertToViewportRectangle(rect);
          var el = document.createElement('div');
          el.className = "annotationItem"
  
          var height = Math.abs(bounds[1] - bounds[3])
          var width = Math.abs(bounds[0] - bounds[2])
          var left = Math.min(bounds[0], bounds[2])
          var top = Math.min(bounds[1], bounds[3])
          el.setAttribute('style', 'position: absolute; background-color: RGB(238,170,0, .25); cursor:pointer; z-index:1;' +
            'left:' + left + 'px; top:' + top + 'px;' +
            'width:' + width + 'px; height:' + height + 'px;');
          this.highlightedElmts.push(el)
  
  
          if (this.textSelection == true) {
            el.className = "highlight" + this.currentUserId;
          }
  
          //add id to current highlighted element index== selected.rectangles.length-1 && this.textSelection==false
          if (this.textSelection == false) {
            el.id = "pdfAnnotation-" + selected.noteId;
            el.addEventListener('click', (e: any) => {
              this.selectedNoteId = selected.noteId
              this.showNoteInModal(selected.noteId, el)
  
            });
          }
          pageElement.appendChild(el);
        });
        const lastIndex = this.highlightedElmts.length - 1  
  
        //open confirmation popop after selection
        if (this.textSelection == true && this.selectedTool == PdfToolType.Highlight) {
          this.confirm(this.highlightedElmts[lastIndex])
  
        }
      }
  
    }
    drawingOnPage(event: MouseEvent, borderRadius: number) {
      this.mouseDownFlag = true;
      localStorage.setItem('mouseDownFlag', JSON.stringify(this.mouseDownFlag));
      
      const path = this.composedPath(event.target);
      const eventPath = path!.find((p: { className: string; }) => p.className === 'page');
  
      if (typeof eventPath !== 'undefined') {
        this.dataPageNumber = +eventPath.getAttribute('data-page-number');
  
        const toDrawRectangle = document.getElementsByClassName('to-draw-rectangle');
  
        const pageOffset = toDrawRectangle[0].getBoundingClientRect();
        this.pagePosition = {
          x: pageOffset.left,
          y: pageOffset.top
        };
  
        this.lastMousePosition = {
          x: event.clientX - this.pagePosition.x,
          y: event.clientY - this.pagePosition.y
        };
  
        this.currentRectId = this.currentUserId + (document.getElementsByClassName('rectangle').length + 1);
        this.drawElement = document.createElement('div');
        this.drawElement.className = 'rectangle';
        this.drawElement.className = "annotationItem"
        this.drawElement.id = 'rectangle-' + this.currentRectId;
        this.drawElement.style.position = 'absolute';
  
  
        if (this.selectedLineHeight != undefined) {
          this.drawElement.style.border = this.selectedLineHeight.toString() + 'px solid RGB(238,170,0, .5)'
        } else {
          this.drawElement.style.border = '2px solid RGB(238,170,0, .5)';
        }
  
  
        this.drawElement.style.borderRadius = borderRadius + '%';
        this.drawElement.style.left = this.lastMousePosition.x + 'px';
        this.drawElement.style.top = this.lastMousePosition.y + 'px';
      }
    }
  
    addingDrawedRectOnPage(event: MouseEvent, borderRadius: number) {
      this.mousePosition = {
        x: event.clientX - this.pagePosition.x,
        y: event.clientY - this.pagePosition.y
      };
      if (this.mouseDownFlag) {
        const width = this.mousePosition.x - this.lastMousePosition.x;
        const height = this.mousePosition.y - this.lastMousePosition.y;
        this.drawingRect = {
          x1: this.lastMousePosition.x,
          y1: this.lastMousePosition.y,
          x2: this.mousePosition.x,
          y2: this.mousePosition.y,
          width: width,
          height: height,
          borderRadius: borderRadius,
          lineHeight: this.selectedLineHeight
        };
  
        if (this.drawElement != null) {
          this.drawElement.style.width = width + 'px';
          this.drawElement.style.height = height + 'px';
          if (this.drawingRect.width > 0 && this.drawingRect.height > 0) {
            document.getElementsByClassName('to-draw-rectangle')[0].appendChild(this.drawElement);
          }
        }
      }
    }

  confirm(element: any) {
    this.mouseDownFlag = false;
    localStorage.setItem('mouseDownFlag', JSON.stringify(false));
    this.save();
  }

  save() {
    localStorage.setItem('mouseDownFlag', JSON.stringify(false));
    const currentRect = {
      rectangleId: ' ',
      pageNumber: this.dataPageNumber,
      coordinates: this.drawingRect,
      isDelete: false,
      type: this.annotationToolForm,
      lineHeight: this.selectedLineHeight,
      _id: '',
    };

    switch (this.selectedTool) {
      case PdfToolType.Highlight:
        break;
      case PdfToolType.DrawBox:
        this.pdfAnnotationToolObject = {
          type: PdfToolType['DrawBox'],
          color: 'RGB(238,170,0, .5)',
          coordinates: [],
          page: currentRect.pageNumber,
          rect: currentRect,
          _id: '',
        };
        break;
      case PdfToolType.Pin:
        this.pdfAnnotationToolObject = {
          type: PdfToolType['Pin'],
          color: 'RGB(238,170,0, .5)',
          coordinates: [this.pinCoords],
          page: this.dataPageNumber,
          _id: '',
        };
        break;
    }

    this.showPopup = false;
    var location: PdfGeneralAnnotationLocation = {
      type: 'Current Slide',
      startPage: this.currentPage,
      lastPage: this.currentPage,
    };
    var pdftool = this.pdfAnnotationToolObject;

    var annotaion: Annotation = {
      type: null,
      content: null,
      location: location,
      tool: pdftool,
      materialID: this.materialId,
      courseId: this.courseId,
    };
    this.drawingRect = {
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
      width: 0,
      height: 0,
      borderRadius: 0,
      lineHeight: 0,
    };
    this.store.dispatch(
      AnnotationActions.setAnnotationProperties({ annotation: annotaion })
    );
    this.showAnnotationDialog();
  }

  showAnnotationDialog() {
    this.store.dispatch(
      AnnotationActions.setCreateAnnotationFromPanel({
        createAnnotationFromPanel: false,
      })
    );
    this.store.dispatch(
      AnnotationActions.setIsAnnotationDialogVisible({
        isAnnotationDialogVisible: true,
      })
    );
  }

  getselectedToolType(toolType: PdfToolType) {
    this.selectedTool = toolType;
    toolTypeSelection(toolType);
  }

  cancel() {
    if (this.selectedTool == PdfToolType.Pin) {
      const pinId = this.pinElement?.getAttribute('id');
      $('#' + pinId).remove();
      this.showPopup = false;
    } else if (this.selectedTool == PdfToolType.DrawBox) {
      const rectId = this.drawElement?.getAttribute('id');
      $('#' + rectId).remove();
      this.showPopup = false;
      this.drawingRect = {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        width: 0,
        height: 0,
        borderRadius: 0,
        lineHeight: 0,
      };
    } else if (this.selectedTool == PdfToolType.Highlight) {
      var highlightedTexts = Array.from(
        document.getElementsByClassName(
          'highlight' + this.currentUserId
        ) as HTMLCollectionOf<HTMLElement>
      );
      for (let i = 0; i < highlightedTexts.length; i++) {
        let element = highlightedTexts[i];
        element.remove();
      }

      this.showPopup = false;
    } else {
      this.showPopup = false;
    }
    this.showPopup = false;
    this.store.dispatch(
      AnnotationActions.setCreateAnnotationFromPanel({
        createAnnotationFromPanel: true,
      })
    );
    this.store.dispatch(AnnotationActions.setShowDrawBoxTools({show: false}));
  }

  searchQueryChangedNext(searchQuery: string) {
    if (searchQuery !== null) {
      this.pdfComponent.eventBus.dispatch('find', {
        query: searchQuery,
        type: 'again',
        caseSensitive: false,
        findPrevious: undefined,
        highlightAll: true,
        phraseSearch: true,
      });
    }
  }
}
