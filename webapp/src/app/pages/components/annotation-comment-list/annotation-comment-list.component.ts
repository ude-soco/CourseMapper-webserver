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

  constructor(
    private annotationService: AnnotationService,
    private notificationService: NotificationServiceService
  ) {}
  ngOnInit(): void {
    this.getAnnotationComments();

    this.annotationService.comments$.subscribe((comments) => {
      this.comments = comments;
    });

    this.notificationService.loggedInTime$.subscribe(async (time) => {
      // let itemDate = new Date(this.comments[4].createdAt);
      // let logged = new Date(time);
      // itemDate = new Date(
      //   Date.UTC(
      //     itemDate.getUTCFullYear(),
      //     itemDate.getUTCMonth(),
      //     itemDate.getUTCDate()
      //   )
      // );

      // logged = new Date(
      //   Date.UTC(
      //     logged.getUTCFullYear(),
      //     logged.getUTCMonth(),
      //     logged.getUTCDate()
      //   )
      // );
      // console.log(
      //   'time',
      //   new Date(time).getTime(),
      //   new Date(this.comments[4].createdAt).getTime(),
      //   new Date(this.comments[4].createdAt) > new Date(time)
      // );

      // console.log(
      //   'test',
      //   new Date(this.comments[1].createdAt).getTime() < time
      // );
      // this.comments.forEach((item) => {
      //   const newest = new Date(item.createdAt).getTime() > time ? true : false;
      //   console.log('newest ', newest);
      // });
      let old = [];
      let old2 = [];

      for (let i = 0; i < this.comments.length; i++) {
        if (new Date(this.comments[i].createdAt).getTime() < time) {
          old.push(this.comments[i]);
        } else {
          old2.push(this.comments[i]);
        }
      }
      console.log('this is old', old);
      console.log('new', old2);

      // const temp = this.comments.filter((item) => {
      //   new Date(item.createdAt).getTime() > new Date(time).getTime();
      // });
      // console.log('temp', temp);
      // once logged in, update the lists
    });
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
