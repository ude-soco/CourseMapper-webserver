import { Component, OnInit } from '@angular/core';
import { Annotation, PdfToolType } from 'src/app/models/Annotations';
import { Store } from '@ngrx/store';
import { computeElapsedTime, getInitials } from 'src/app/format';
import { getAnnotationsForMaterial, getCurrentPdfPage, State } from '../state/annotation.reducer';
import { SelectItemGroup } from 'primeng/api';
@Component({
  selector: 'app-pdf-comment-panel',
  templateUrl: './pdf-comment-panel.component.html',
  styleUrls: ['./pdf-comment-panel.component.css'],
})
export class PdfCommentPanelComponent implements OnInit {
  annotations: Annotation[] = [];
  searchFilters: SelectItemGroup[];
  selectedFilter: number;
  currentPage: number;
  annotationOnCurrentPage: Annotation[];

  constructor(private store: Store<State>) {
    this.searchFilters = [
      {
          label: 'Annotation Tools', value: 'tool', 
          items: [
              {label: 'Drawing', value: 0},
              {label: 'Pinpoint', value: 1},
              {label: 'Highlight', value: 2},
          ]
      },
      {
          label: 'Annotation Types', value: 'type', 
          items: [
              {label: 'Note', value: 3},
              {label: 'Question', value: 4},
              {label: 'External Resource', value: 5},
          ]
      },
      {
          label: 'Sort By', value: 'sort', 
          items: [
              {label: 'Show All Annotations', value: 6},
              {label: 'Date (Oldest To Newest)', value: 7},
              {label: 'Date (Newest To Oldest)', value: 8},
              {label: 'By User Name (A-Z)', value: 9},
              {label: 'By User Name (Z-A)', value: 10}
          ]
      }
  ];
  
    this.store.select(getAnnotationsForMaterial).subscribe((annotations) => {
      this.annotations = annotations;
      this.showAnnotationOnCurrentPage();
    });

    this.store.select(getCurrentPdfPage).subscribe((page) => {
      this.currentPage = page;
      this.selectedFilter = null;
      this.showAnnotationOnCurrentPage();
    });
  }

  ngOnInit(): void {
    this.currentPage = 1;
  }

  showAnnotationOnCurrentPage() {
    
    this.annotationOnCurrentPage = this.annotations.filter((anno) => anno.location.startPage == this.currentPage);
  }

  onAnnotationFilterChange() {
    switch (this.selectedFilter) {
      case 0:
        this.annotationOnCurrentPage = this.annotations.filter(
          (anno) => anno.tool.type == PdfToolType.DrawBox
        );
        break;
      case 1:
        this.annotationOnCurrentPage = this.annotations.filter(
          (anno) => anno.tool.type == PdfToolType.Pin
        );
        break;
      case 2:
        this.annotationOnCurrentPage = this.annotations.filter(
          (anno) => anno.tool.type == PdfToolType.Highlight
        );
        break;
      case 3:
        this.annotationOnCurrentPage = this.annotations.filter(
          (anno) => anno.type == 'Note'
        );
        break;
      case 4:
        this.annotationOnCurrentPage = this.annotations.filter(
          (anno) => anno.type == 'Question'
        );
        break;
      case 5:
        this.annotationOnCurrentPage = this.annotations.filter(
          (anno) => anno.type == 'External Resource'
        );
        break;
      case 6:
        this.annotationOnCurrentPage = this.annotations
        break;
      case 7:
        this.annotationOnCurrentPage = this.annotationOnCurrentPage.sort((b,a) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break;
      case 8:
        this.annotationOnCurrentPage = this.annotationOnCurrentPage.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break;
      case 9:
        this.annotationOnCurrentPage = this.annotationOnCurrentPage.sort((a, b) => a.author.name.toLowerCase().localeCompare(b.author.name.toLowerCase()))
        break;
      case 10:
        this.annotationOnCurrentPage = this.annotationOnCurrentPage.sort((a, b) => b.author.name.toLowerCase().localeCompare(a.author.name.toLowerCase()))
        break;
      default:
        this.annotationOnCurrentPage = this.annotations.filter((anno) => anno.location.startPage == this.currentPage);
        break;
    }
  }
}
