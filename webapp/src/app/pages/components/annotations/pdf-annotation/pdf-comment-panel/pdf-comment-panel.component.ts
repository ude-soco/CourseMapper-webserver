import { Component, OnInit } from '@angular/core';
import { Annotation } from 'src/app/models/Annotations';
import { Store } from '@ngrx/store';
import { computeElapsedTime, getInitials } from 'src/app/format';
import { getAnnotationsForMaterial, State } from '../state/annotation.reducer';
@Component({
  selector: 'app-pdf-comment-panel',
  templateUrl: './pdf-comment-panel.component.html',
  styleUrls: ['./pdf-comment-panel.component.css'],
})
export class PdfCommentPanelComponent implements OnInit {
  annotations: Annotation[] = [];

  constructor(private store: Store<State>) {
    this.store.select(getAnnotationsForMaterial).subscribe((annotations) => {
      this.annotations = annotations;
    });
  }

  ngOnInit(): void {}
}
