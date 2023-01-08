import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { PdfViewerComponent } from 'ng2-pdf-viewer';
import { Subscription } from 'rxjs';
import { Material } from 'src/app/models/Material';

import { PdfviewService } from 'src/app/services/pdfview.service';
import { toolTypeSelection } from 'src/app/tool-type-selection';
import {
  Position,
  Rectangle,
  RectangleObject,
} from 'src/app/models/AnnotationForms';
import { PdfToolType } from 'src/app/models/Annotations';
import { environment } from 'src/environments/environment';

const ZOOM_STEP: number = 0.25;
const DEFAULT_ZOOM: number = 1;
@Component({
  selector: 'app-view-pdf',
  templateUrl: './view-pdf.component.html',
  styleUrls: ['./view-pdf.component.css'],
})
export class ViewPdfComponent implements OnInit {
  @ViewChild(PdfViewerComponent, { static: false })
  private pdfComponent!: PdfViewerComponent;
  matchesFound: any = 0;
  @Input() materialId?: any;
  @Input() material: any;
  @Input() materialType: any;
  currentPage: number = 1;
  zoom = DEFAULT_ZOOM;
  totalPages: any;
  docURL!: string;
  subs = new Subscription();
  private API_URL = environment.API_URL;
  constructor(private pdfViewService: PdfviewService) {
    this.getDocUrl();
  }

  ngOnInit(): void {
    //this.getDocUrl()
  }
  getDocUrl() {
    // this.subs.add(this.pdfviewService.currentDocURL.subscribe(url => {
    //   this.docURL = this.API_URL + url.replace(/\\/g, "/")
    //   console.log("this.docURL")
    //   console.log(this.docURL)
    // }))
    this.subs.add(
      this.pdfViewService.currentDocURL.subscribe((url) => {
        this.docURL = this.API_URL + url.replace(/\\/g, '/');
        console.log('this.docURL');
        console.log(url);
      })
    );
    // this.docURL = this.API_URL + "/public/uploads/pdfs/"+this.materialId+".pdf"
    //        console.log("this.docURL")
    //  console.log(this.docURL)
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

  pageRendered(event: any) {}

  paginate(event) {
    this.currentPage = event.page + 1;
    this.pdfViewService.setPageNumber(this.currentPage);
  }

  getselectedToolType(toolType: string){

  }

  mouseEvent(event: { type: string; clientX: number; clientY: number; target: any; }){
    
  }
}
