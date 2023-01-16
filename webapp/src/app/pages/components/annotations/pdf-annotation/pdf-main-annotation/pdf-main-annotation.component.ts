import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { PdfViewerComponent } from 'ng2-pdf-viewer';
import { toolTypeSelection } from 'src/app/tool-type-selection';
import { Rectangle, RectangleObject } from 'src/app/models/AnnotationForms';
import { PdfToolType } from 'src/app/models/Annotations';
import { getSelectedTool, State } from '../state/annotation.reducer';
import { Store } from '@ngrx/store';
import { getMouseEvent } from '../../../materils/state/materials.reducer';
import { PdfviewService } from 'src/app/services/pdfview.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import * as MaterialActions from 'src/app/pages/components/materils/state/materials.actions'
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions'
import * as $ from 'jquery';
import { AnnotationType } from 'src/app/models/Annotations';
const ZOOM_STEP: number = 0.25;
const DEFAULT_ZOOM: number = 1;

@Component({
  selector: 'app-pdf-main-annotation',
  templateUrl: './pdf-main-annotation.component.html',
  styleUrls: ['./pdf-main-annotation.component.css'],
})
export class PdfMainAnnotationComponent implements OnInit {
  // Pdf-View properties
  @ViewChild(PdfViewerComponent, { static: false }) private pdfComponent!: PdfViewerComponent;
  matchesFound: any = 0;
  currentPage: number = 1;
  zoom = DEFAULT_ZOOM;
  totalPages: any;
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
  mouseDownFlag = false;
  drawElement!: any;
  dataPageNumber = 1;
  highlightedElmts: any[] = [];
  showPopup = false;
  isAnnotationDialogVisible: boolean = false;
  pdfAnnotationToolObject!: {
    type: PdfToolType;
    color: string;
    coordinates: any[];
    page: any;
    rect?: RectangleObject;
    _id: any;
  };
  selectedTool!: PdfToolType;
  selectedLineHeight: number = 2;
  annotationToolForm!: string;
  highlightObjectsList: any = [];
  currentUserId = '6150542959fa724a51ba859e';
  pinCoords: any;
  pinElement !: any;
  textSelection!: boolean;
  selectedNoteId: any;

  constructor(private pdfViewService: PdfviewService, private store: Store<State>) {
    this.getDocUrl();
    this.store.select(getMouseEvent).subscribe((event) => {
      if (event.type === 'mouseup') {
        this.store.select(getSelectedTool).subscribe((tool) => {
          this.selectedTool = tool;
          this.getselectedToolType(tool);
          console.log(this.selectedTool);
        });
        this.mouseEvent(event);
      }
    });
  }

  getDocUrl() {
    this.subs.add(
      this.pdfViewService.currentDocURL.subscribe((url) => {
        this.docURL = this.API_URL + url.replace(/\\/g, '/');
        console.log('this.docURL');
        console.log(url);
      })
    );
  }

  pagechanging(e: any) {
    this.currentPage = e.pageNumber; // the page variable
    console.log(' this.currentPage');
    console.log(this.currentPage);
    this.pdfViewService.setPageNumber(this.currentPage);
  }

  public handlePdfLoaded(pdf: any): void {
    this.totalPages = pdf.numPages;
    console.log(this.totalPages);
    this.pdfViewService.setTotalPages(this.totalPages);
    this.pdfComponent.pdfViewer.currentScaleValue = 'page-fit';
    this.pdfComponent.pdfViewer.eventBus.on(
      'updatefindmatchescount',
      (data: any) => {
        this.matchesFound = data.matchesCount.total;
        console.log('total matches found: ', data.matchesCount.total);
      }
    );

    this.pdfComponent.pdfViewer.eventBus.on(
      'updatefindcontrolstate',
      (data: any) => {
        if (data.state === 0) {
          console.log('no matches found');
        }
      }
    );
  }

  pageRendered(event: any) { }

  paginate(event) {
    this.currentPage = event.page + 1;
    this.pdfViewService.setPageNumber(this.currentPage);
  }

  mouseEventAction(event: MouseEvent) {
    if (event.type === "mouseup") {
      this.store.dispatch(MaterialActions.setMouseEvent({ mouseEvent: event }));
      console.log(event.type);
    }
  }

  ngOnInit(): void { }

  // Highlight annotaion tool

  mouseEvent(event: MouseEvent) {
    //mouse event to highlight text selection
    if (this.selectedTool == PdfToolType.Highlight) {
      console.log("I am in");
      this.getSelectedText();
    } else {
      this.mouseDownFlag = false;

      if (
        this.drawingRect.height > 0 &&
        this.drawingRect.width > 0 &&
        this.selectedTool == PdfToolType.DrawBox
      ) {
        this.confirm(this.drawElement);
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
      this.highlightText({ page: pageIndex, rectangles: selectedUniqueArray });
      this.saveNoteAndCoordsAfterHighlighting({
        page: pageIndex + 1,
        rectangles: selectedUniqueArray,
      });
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

  highlightText(selected: { page: any; rectangles: any[]; noteId?: any }) {
    var pageIndex = selected.page;

    if (!this.textSelection) {
      pageIndex = pageIndex;
    }
    var page = this.pdfComponent.pdfViewer.getPageView(pageIndex);

    var pageElement = page.canvas.parentElement;
    var viewport = page.viewport;
    const existHighlight = document.getElementById(
      'pdfAnnotation-' + selected.noteId
    );
    if (existHighlight == undefined) {
      selected.rectangles.forEach((rect: any, index) => {
        var bounds = viewport.convertToViewportRectangle(rect);
        var el = document.createElement('div');
        el.className = 'annotationItem';

        var height = Math.abs(bounds[1] - bounds[3]);
        var width = Math.abs(bounds[0] - bounds[2]);
        var left = Math.min(bounds[0], bounds[2]);
        var top = Math.min(bounds[1], bounds[3]);
        el.setAttribute(
          'style',
          'position: absolute; background-color: RGB(238,170,0, .25); cursor:pointer; z-index:1;' +
          'left:' +
          left +
          'px; top:' +
          top +
          'px;' +
          'width:' +
          width +
          'px; height:' +
          height +
          'px;'
        );
        this.highlightedElmts.push(el);

        if (this.textSelection == true) {
          el.className = 'highlight' + this.currentUserId;
        }
        if (this.textSelection == false) {
          el.id = 'pdfAnnotation-' + selected.noteId;
          el.addEventListener('click', (e: any) => {
            this.selectedNoteId = selected.noteId;
          });
        }
        pageElement.appendChild(el);
      });
      const lastIndex = this.highlightedElmts.length - 1;
      if (this.textSelection == true && this.selectedTool == PdfToolType.Highlight) {
        this.confirm(this.highlightedElmts[lastIndex]);
      }
    }
  }
  confirm(element: any) {
    this.mouseDownFlag = false;
    this.save();
  }

  save() {
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
    this.showAnnotationDialog();
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
  }

  showAnnotationDialog() {
    this.store.dispatch(AnnotationActions.setCreateAnnotationFromPanel({createAnnotationFromPanel: false}));
    this.isAnnotationDialogVisible = true;
  }

  getselectedToolType(toolType: PdfToolType) {
    this.selectedTool = toolType;
    toolTypeSelection(toolType);
  }

  cancel() {
    if (this.isAnnotationDialogVisible) {
      this.isAnnotationDialogVisible = false;
    }

    if (this.selectedTool == PdfToolType.Pin) {
      const pinId = this.pinElement.getAttribute('id');
      $('#' + pinId).remove();
      this.showPopup = false;
    } else if (this.selectedTool == PdfToolType.DrawBox) {
      const rectId = this.drawElement.getAttribute('id');
      $('#' + rectId).remove();
      this.showPopup = false;
      this.drawingRect = { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0, borderRadius: 0, lineHeight: 0 };
    } else if (this.selectedTool == PdfToolType.Highlight) {
      var highlightedTexts = Array.from(document.getElementsByClassName('highlight' + this.currentUserId) as HTMLCollectionOf<HTMLElement>);
      for (let i = 0; i < highlightedTexts.length; i++) {
        let element = highlightedTexts[i];
        element.remove()

      }

      this.showPopup = false;
    } else {
      this.showPopup = false;
    }
    this.showPopup = false;
    this.store.dispatch(AnnotationActions.setCreateAnnotationFromPanel({createAnnotationFromPanel: true}));
  }
}
