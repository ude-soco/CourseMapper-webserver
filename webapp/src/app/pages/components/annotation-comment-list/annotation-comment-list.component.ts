import { Component, OnInit } from '@angular/core';
import { AnnotationService } from 'src/app/services/annotation.service';
import { Comment } from 'src/app/model/comment';
import { NotificationServiceService } from 'src/app/services/notification-service.service';

@Component({
  selector: 'app-annotation-comment-list',
  templateUrl: './annotation-comment-list.component.html',
  styleUrls: ['./annotation-comment-list.component.css'],
})
export class AnnotationCommentListComponent implements OnInit {
  comments!: Comment[];
  newComments!: Comment[];
  lastTimeLoggedIn!: any;
  oldComments!: Comment[];
  constructor(
    private annotationService: AnnotationService,
    private notificationService: NotificationServiceService
  ) {}
  ngOnInit(): void {
    this.getAnnotationComments();

    this.annotationService.comments$.subscribe((comments) => {
      this.comments = comments;
      this.updateComments();
      console.log('new comments', this.newComments);
    });
  }

  updateComments() {
    const lastTime = this.notificationService.getLoggedInTime();
    this.lastTimeLoggedIn = new Date(lastTime).toLocaleDateString();

    let newLists = [];
    let old = [];

    for (let i = 0; i < this.comments.length; i++) {
      if (new Date(this.comments[i].createdAt).getTime() > lastTime) {
        newLists.push(this.comments[i]);
      } else {
        old.push(this.comments[i]);
      }
    }
    this.newComments = [...newLists];
    this.oldComments = [...old];
  }

  getAnnotationComments() {
    const courseId = '633ffce76076b6a2e67c3162';
    const annotationId = '63514d0261d005c29e6af9c6';
    this.annotationService
      .getCommentsForAnnotation(courseId, annotationId)
      .subscribe((data: any) => {
        let temp = data.replies;
        this.annotationService.comments.next(temp);
        console.log('comments', data, temp);
        this.comments = temp;
      });
  }
}
