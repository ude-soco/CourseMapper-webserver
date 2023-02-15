import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { computeElapsedTime, getInitials } from 'src/app/format';
import { Annotation } from 'src/app/models/Annotations';
import { Reply } from 'src/app/models/Reply';

@Component({
  selector: 'app-pdf-reply-item',
  templateUrl: './pdf-reply-item.component.html',
  styleUrls: ['./pdf-reply-item.component.css']
})
export class PdfReplyItemComponent implements OnInit, OnChanges {
  @Input() reply: Reply;
  replyInitials?: string;
  replyElapsedTime?: string;
  constructor() {

   }
  ngOnChanges(changes: SimpleChanges): void {
    if('reply' in  changes){
      this.replyInitials = getInitials(this.reply?.author?.name);
      this.replyElapsedTime = computeElapsedTime(this.reply?.createdAt)
    }
  }

  ngOnInit(): void {
  }

}
