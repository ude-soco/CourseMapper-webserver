import { Component, OnInit } from '@angular/core';
import { Annotation } from 'src/app/models/Annotations';
import { Store } from '@ngrx/store';
import { computeElapsedTime, getInitials } from 'src/app/format';
import { getAnnotationsForMaterial, State } from '../state/annotation.reducer';
import { SelectItemGroup } from 'primeng/api';
@Component({
  selector: 'app-pdf-comment-panel',
  templateUrl: './pdf-comment-panel.component.html',
  styleUrls: ['./pdf-comment-panel.component.css'],
})
export class PdfCommentPanelComponent implements OnInit {
  annotations: Annotation[] = [];
  searchFilters: SelectItemGroup[];
  selectedFilter: any;

  constructor(private store: Store<State>) {
    this.searchFilters = [
      {
          label: 'Annotation Tools', value: 'tool', 
          items: [
              {label: 'Drawing', value: ''},
              {label: 'Pinpoint', value: ''},
              {label: 'Highlight', value: ''},
          ]
      },
      {
          label: 'Annotation Types', value: 'type', 
          items: [
              {label: 'Note', value: ''},
              {label: 'Question', value: ''},
              {label: 'External Resource', value: ''},
          ]
      },
      {
          label: 'Sort By', value: 'sort', 
          items: [
              {label: 'Date (Oldest To Newest)', value: ''},
              {label: 'Date (Newest To Oldest)', value: ''},
              {label: 'By User Name (A-Z)', value: ''},
              {label: 'By User Name (Z-A)', value: ''}
          ]
      }
  ];
  
    this.store.select(getAnnotationsForMaterial).subscribe((annotations) => {
      this.annotations = annotations;
    });
  }

  ngOnInit(): void {}
}
