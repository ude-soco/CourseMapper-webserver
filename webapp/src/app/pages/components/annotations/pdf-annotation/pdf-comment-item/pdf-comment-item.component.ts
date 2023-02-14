import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { getInitials } from 'src/app/format';
import { Annotation } from 'src/app/models/Annotations';
import { getAnnotationsForMaterial, State } from '../state/annotation.reducer';

@Component({
  selector: 'app-pdf-comment-item',
  templateUrl: './pdf-comment-item.component.html',
  styleUrls: ['./pdf-comment-item.component.css'],
})
export class PdfCommentItemComponent implements OnInit {
  @Input() annotationsWithInitials: Annotation[] = [];

  constructor(private store: Store<State>) {}

  ngOnInit(): void {}
}
