import { Component, Input, OnInit } from '@angular/core';
import { getInitials } from 'src/app/helper/getInitial';
import { Comment } from 'src/app/model/comment';

@Component({
  selector: 'app-annotation-comment-list-item',
  templateUrl: './annotation-comment-list-item.component.html',
  styleUrls: ['./annotation-comment-list-item.component.css'],
})
export class AnnotationCommentListItemComponent implements OnInit {
  @Input() comments!: Comment[];
  getInitials = getInitials;

  constructor() {}

  ngOnInit(): void {}
}
