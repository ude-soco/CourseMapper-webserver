import { Component, OnInit, ViewChild } from '@angular/core';
import { PdfViewerComponent } from 'ng2-pdf-viewer';
import { toolTypeSelection } from 'src/app/tool-type-selection';
import { Rectangle, RectangleObject } from 'src/assets/Data/AnnotationForms';
import { PdfToolType } from 'src/assets/Data/Annotations';

@Component({
  selector: 'app-pdf-main-annotation',
  templateUrl: './pdf-main-annotation.component.html',
  styleUrls: ['./pdf-main-annotation.component.css']
})
export class PdfMainAnnotationComponent implements OnInit {

  @ViewChild(PdfViewerComponent, { static: false }) private pdfComponent!: PdfViewerComponent;

    // Annotation properties
    drawingRect: Rectangle = { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0, borderRadius: 0, lineHeight: 0 };
    mouseDownFlag = false;
    drawElement !: any;
    dataPageNumber = 1;
    highlightedElmts: any[] = [];
    showPopup = false;
    isAnnotationDialogVisible: boolean = false;
    pdfAnnotationToolObject!: { type: PdfToolType; color: string; coordinates: any[]; page: any; rect?: RectangleObject; _id: any };
    selectedTool!: string;
    selectedLineHeight: number = 2;
    annotationToolForm!: string
    highlightObjectsList: any = []
    currentUserId = "6150542959fa724a51ba859e"
    pinCoords: any
    textSelection!: boolean;
    selectedNoteId: any

  constructor() { }

  ngOnInit(): void {
  }

  
  // Highlight annotaion tool

  mouseEvent(event: { type: string; clientX: number; clientY: number; target: any; }) {
    //mouse event to highlight text selection
    if (event.type === 'mouseup') {
      if (this.selectedTool == "highlightTool") {
        this.getSelectedText()
      } else {
        this.mouseDownFlag = false;

        if (this.drawingRect.height > 0 && this.drawingRect.width > 0 && this.selectedTool == "drawBoxTool") {
          this.confirm(this.drawElement)
        }
      }

    }
}

getSelectedText() {
  this.textSelection = true
  var pageIndex = this.pdfComponent.pdfViewer.currentPageNumber - 1;
  var page = this.pdfComponent.pdfViewer.getPageView(pageIndex);
  var pageRect = page.canvas.getClientRects()[0];
  let selectionRects = window.getSelection()!.getRangeAt(0).getClientRects();
  //check if text is selected
  if (window.getSelection()?.toString().length! > 0) {
    var viewport = page.viewport;
    var selected = Object.values(selectionRects).map((r: any) => {
      return viewport.convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y).concat(
        viewport.convertToPdfPoint(r.right - pageRect.x, r.bottom - pageRect.y))
        ;
    });

    //remove duplicates in coordinatates
    var selectedUniqueSet = new Set(selected)
    var selectedUniqueArray = [...selectedUniqueSet]
    this.highlightText({ page: pageIndex, rectangles: selectedUniqueArray })
    this.saveNoteAndCoordsAfterHighlighting({ page: pageIndex + 1, rectangles: selectedUniqueArray })

  }

}

saveNoteAndCoordsAfterHighlighting(selected: { page: any; rectangles: any[]; }) {
  this.pdfAnnotationToolObject = { type: PdfToolType['Highlight'], color: 'RGB(238,170,0, .25)', coordinates: selected.rectangles, page: selected.page, _id: '' }
}

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
      if (this.textSelection == false) {
        el.id = "pdfAnnotation-" + selected.noteId;
        el.addEventListener('click', (e: any) => {
          this.selectedNoteId = selected.noteId
        });
      }
      pageElement.appendChild(el);
    });
    const lastIndex = this.highlightedElmts.length - 1
    if (this.textSelection == true && this.selectedTool == "highlightTool") {
      this.confirm(this.highlightedElmts[lastIndex])

    }
  }

}
confirm(element: any) {
  this.mouseDownFlag = false
  this.save()
}

save() {
  const currentRect = {
    rectangleId: " ",
    pageNumber: this.dataPageNumber,
    coordinates: this.drawingRect,
    isDelete: false,
    type: this.annotationToolForm,
    lineHeight: this.selectedLineHeight,
    _id: ""
  }

  switch (this.selectedTool) {
    case "highlightTool":
      break;
    case "drawBoxTool":
      this.pdfAnnotationToolObject = { type: PdfToolType['DrawBox'], color: 'RGB(238,170,0, .5)', coordinates: [], page: currentRect.pageNumber, rect: currentRect, _id: '' }
      break;
    case "pinPointTool":
      this.pdfAnnotationToolObject = { type: PdfToolType['Pin'], color: 'RGB(238,170,0, .5)', coordinates: [this.pinCoords], page: this.dataPageNumber, _id: '' }
      break;
  }
  this.showPopup = false;
  this.showAnnotationDialog()
  this.drawingRect = { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0, borderRadius: 0, lineHeight: 0 };
}

showAnnotationDialog() {
  this.isAnnotationDialogVisible = true;

}

getselectedToolType(toolType: string) {
  this.selectedTool = toolType
  toolTypeSelection(toolType)
}

}
