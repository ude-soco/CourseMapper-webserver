import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Annotation } from 'src/app/models/Annotations';
import { Reply } from 'src/app/models/Reply';

@Component({
  selector: 'app-pdf-reply-panel',
  templateUrl: './pdf-reply-panel.component.html',
  styleUrls: ['./pdf-reply-panel.component.css'],
})
export class PdfReplyPanelComponent implements OnInit, OnChanges  {
  @Input() annotation: Annotation;
  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
  }

  ngOnInit(): void {}
}
