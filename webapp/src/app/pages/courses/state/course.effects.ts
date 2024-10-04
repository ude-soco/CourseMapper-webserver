import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import * as CourseActions from 'src/app/pages/courses/state/course.actions';
import * as MaterialActions from 'src/app/pages/components/materials/state/materials.actions';
import * as NotificationActions from 'src/app/pages/components/notifications/state/notifications.actions';
import {
  getCurrentCourse,
  getCurrentCourseId,
  getSelectedChannel,
  getSelectedTagName,
  getSelectedTopic,
} from './course.reducer';
import { Injectable } from '@angular/core';
import { createEffect, ofType, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  withLatestFrom,
  switchMap,
  mergeMap,
  catchError,
  of,
  filter,
  EMPTY,
  forkJoin,
  map,
  tap,
} from 'rxjs';
import { AnnotationService } from 'src/app/services/annotation.service';
import { LoggerService } from 'src/app/services/logger.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { TagService } from 'src/app/services/tag.service';
import { getCurrentMaterial } from '../../components/materials/state/materials.reducer';
import { Router } from '@angular/router';
import { State } from 'src/app/state/app.reducer';
import { Annotation } from 'src/app/models/Annotations';
import { NotificationsService } from 'src/app/services/notifications.service';
import { BlockingNotifications } from 'src/app/models/BlockingNotification';
import * as AppActions from 'src/app/state/app.actions';
@Injectable()
export class CourseEffects {
  getTagsForCourse$ = createEffect(() =>
    this.actions$.pipe(
      filter(
        (action) =>
          action.type === CourseActions.setCurrentCourse.type ||
          action.type === AnnotationActions.postAnnotationSuccess.type ||
          action.type === AnnotationActions.postReplySuccess.type ||
          action.type === AnnotationActions.deleteAnnotationSuccess.type ||
          action.type === AnnotationActions.deleteReplySuccess.type ||
          action.type === CourseActions.postReplySuccess.type ||
          action.type === CourseActions.deleteAnnotationSuccess.type ||
          action.type === CourseActions.deleteReplySuccess.type
      ),
      withLatestFrom(this.store.select(getCurrentCourse)),
      filter(([action, course]) => !!course),
      switchMap(([action, course]) =>
        this.TagService.getAllTagsForCurrentCourse(course).pipe(
          mergeMap((tags) => [
            CourseActions.LoadTagsSuccess({ tags: tags, tagsFor: 'course' }),
          ]),
          catchError((error) => {
            if (error.status === 401) {
              // console.warn("User session expired or not authenticated.");
              //this.showError("Your session has expired. Please log in again.");
              // Handle additional logic here if needed (like navigating to the login page)
            } else {
              // console.error("Error fetching tags:", error);
            }
            return of(CourseActions.LoadTagsFail({ error }));
          })
        )
      )
    )
  );

  getTagsForTopic$ = createEffect(() =>
    this.actions$.pipe(
      filter(
        (action) =>
          action.type === CourseActions.setCurrentTopic.type ||
          action.type === AnnotationActions.postAnnotationSuccess.type ||
          action.type === AnnotationActions.postReplySuccess.type ||
          action.type === AnnotationActions.deleteAnnotationSuccess.type ||
          action.type === AnnotationActions.deleteReplySuccess.type ||
          action.type === CourseActions.postReplySuccess.type ||
          action.type === CourseActions.deleteAnnotationSuccess.type ||
          action.type === CourseActions.deleteReplySuccess.type
      ),
      withLatestFrom(this.store.select(getSelectedTopic)),
      filter(([action, topic]) => !!topic),
      switchMap(([action, topic]) =>
        this.TagService.getAllTagsForCurrentTopic(topic).pipe(
          mergeMap((tags) => [
            CourseActions.LoadTagsSuccess({ tags: tags, tagsFor: 'topic' }),
          ]),
          catchError((error) => of(CourseActions.LoadTagsFail({ error })))
        )
      )
    )
  );

  getTagsForChannel$ = createEffect(() =>
    this.actions$.pipe(
      filter(
        (action) =>
          action.type === CourseActions.SetSelectedChannel.type ||
          action.type === AnnotationActions.postAnnotationSuccess.type ||
          action.type === AnnotationActions.postReplySuccess.type ||
          action.type === AnnotationActions.deleteAnnotationSuccess.type ||
          action.type === AnnotationActions.deleteReplySuccess.type ||
          action.type === CourseActions.postReplySuccess.type ||
          action.type === CourseActions.deleteAnnotationSuccess.type ||
          action.type === CourseActions.deleteReplySuccess.type
      ),
      withLatestFrom(this.store.select(getSelectedChannel)),
      filter(([action, channel]) => !!channel),
      switchMap(([action, channel]) =>
        this.TagService.getAllTagsForCurrentChannel(channel).pipe(
          mergeMap((tags) => [
            CourseActions.LoadTagsSuccess({ tags: tags, tagsFor: 'channel' }),
          ]),
          catchError((error) => of(CourseActions.LoadTagsFail({ error })))
        )
      )
    )
  );

  getAnnotationsForTag$ = createEffect(() =>
    this.actions$.pipe(
      filter(
        (action) =>
          action.type === CourseActions.loadAnnotationsForSelectedTag.type
      ),
      withLatestFrom(
        this.store.select(getCurrentCourseId),
        this.store.select(getSelectedTagName)
      ),
      filter(([action, course, tag]) => !!course && !!tag),
      switchMap(([action, course, tag]) =>
        this.TagService.getAllAnnotationsForTag(course, tag).pipe(
          mergeMap((annotations) => [
            CourseActions.loadAnnotationsForSelectedTagSuccess({
              annotations: annotations,
            }),
            CourseActions.loadReplies({ annotations }),
          ]),
          catchError((error) =>
            of(CourseActions.loadAnnotationsForSelectedTagFail({ error }))
          )
        )
      )
    )
  );

  loadRepliesForTag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.loadReplies),
      switchMap(({ annotations }) =>
        forkJoin(
          annotations.map((annotation) =>
            this.annotationService
              .getAllReplies(annotation)
              .pipe(
                map(
                  (replies) =>
                    ({ ...annotation, replies: replies } as Annotation)
                )
              )
          )
        ).pipe(
          map((updatedAnnotations) =>
            CourseActions.updateAnnotationsWithReplies({
              annotations: updatedAnnotations,
            })
          ),
          catchError((error) =>
            of(CourseActions.updateAnnotationsWithRepliesFail({ error }))
          )
        )
      )
    )
  );

  //TODO: Edit code below when implementing mentions for tag page.
  postReplyForTag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.postReply),
      mergeMap(({ annotation, reply, mentionedUsers }) =>
        this.annotationService
          .postReply(annotation, reply, mentionedUsers)
          .pipe(
            mergeMap(() => [
              CourseActions.postReplySuccess(),
              // AnnotationActions.loadAnnotations(),
            ]),
            catchError((error) => of(CourseActions.postReplyFail({ error })))
          )
      )
    )
  );

  likeAnnotationForTag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.likeAnnotation),
      mergeMap(({ annotation }) =>
        this.annotationService.likeAnnotation(annotation).pipe(
          mergeMap(() => [CourseActions.likeAnnotationSuccess()]),
          catchError((error) => of(CourseActions.likeAnnotationFail({ error })))
        )
      )
    )
  );

  dislikeAnnotationForTag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.dislikeAnnotation),
      mergeMap(({ annotation }) =>
        this.annotationService.dislikeAnnotation(annotation).pipe(
          mergeMap(() => [CourseActions.dislikeAnnotationSuccess()]),
          catchError((error) =>
            of(CourseActions.dislikeAnnotationFail({ error }))
          )
        )
      )
    )
  );

  likeReplyForTag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.likeReply),
      mergeMap(({ reply }) =>
        this.annotationService.likeReply(reply).pipe(
          mergeMap(() => [CourseActions.likeReplySuccess()]),
          catchError((error) => of(CourseActions.likeReplyFail({ error })))
        )
      )
    )
  );

  dislikeReplyForTag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.dislikeReply),
      mergeMap(({ reply }) =>
        this.annotationService.dislikeReply(reply).pipe(
          mergeMap(() => [CourseActions.dislikeReplySuccess()]),
          catchError((error) => of(CourseActions.dislikeReplyFail({ error })))
        )
      )
    )
  );

  deleteReplyForTag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.deleteReply),
      mergeMap(({ reply }) =>
        this.annotationService.deleteReply(reply).pipe(
          mergeMap(() => [CourseActions.deleteReplySuccess()]),
          catchError((error) => of(CourseActions.deleteReplyFail({ error })))
        )
      )
    )
  );

  editReplyForTag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.editReply),
      mergeMap(({ reply, updatedReply }) =>
        this.annotationService.editReply(reply, updatedReply).pipe(
          mergeMap(() => [CourseActions.editReplySuccess()]),
          catchError((error) => of(CourseActions.editReplyFail({ error })))
        )
      )
    )
  );

  deleteAnnotationForTag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.deleteAnnotation),
      mergeMap(({ annotation }) =>
        this.annotationService.deleteAnnotation(annotation).pipe(
          mergeMap(() => [CourseActions.deleteAnnotationSuccess()]),
          catchError((error) =>
            of(CourseActions.deleteAnnotationFail({ error }))
          )
        )
      )
    )
  );

  editAnnotationForTag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourseActions.editAnnotation),
      mergeMap(({ annotation }) =>
        this.annotationService.editAnnotation(annotation).pipe(
          mergeMap(() => [CourseActions.editAnnotationSuccess()]),
          catchError((error) => of(CourseActions.editAnnotationFail({ error })))
        )
      )
    )
  );

  setCourseLevelNotification$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CourseActions.setCourseNotificationSettings),

      mergeMap((action) =>
        this.notificationService
          .setCourseNotificationSettings(action.settings)
          .pipe(
            mergeMap((updatedDoc: BlockingNotifications) => [
              CourseActions.setCourseNotificationSettingsSuccess({
                updatedDoc,
              }),
              NotificationActions.setCourseNotificationSettingsSuccess({
                updatedDoc,
              }),
            ]),
            catchError((error) => {
              console.log(error);
              return of(
                CourseActions.setCourseNotificationSettingsFailure({
                  error,
                })
              );
            })
          )
      )
    );
  });

  unsetCourseLevelNotification$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CourseActions.unsetCourseNotificationSettings),

      mergeMap((action) =>
        this.notificationService
          .unsetCourseNotificationSettings(action.settings)
          .pipe(
            mergeMap((updatedDoc: BlockingNotifications) => [
              CourseActions.unsetCourseNotificationSettingsSuccess({
                updatedDoc,
              }),
              NotificationActions.unsetCourseNotificationSettingsSuccess({
                updatedDoc,
              }),
            ]),
            catchError((error) => {
              console.log(error);
              return of(
                CourseActions.unsetCourseNotificationSettingsFailure({
                  error,
                })
              );
            })
          )
      )
    );
  });

  setTopicLevelNotification$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CourseActions.setTopicNotificationSettings),

      mergeMap((action) =>
        this.notificationService
          .setTopicNotificationSettings(action.settings)
          .pipe(
            map((updatedDoc: BlockingNotifications) =>
              CourseActions.setTopicNotificationSettingsSuccess({
                updatedDoc,
              })
            ),
            catchError((error) => {
              console.log(error);
              return of(
                CourseActions.setTopicNotificationSettingsFailure({
                  error,
                })
              );
            })
          )
      )
    );
  });
  setChannelLevelNotification$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CourseActions.setChannelNotificationSettings),

      mergeMap((action) =>
        this.notificationService
          .setChannelNotificationSettings(action.settings)
          .pipe(
            map((updatedDoc: BlockingNotifications) =>
              CourseActions.setChannelNotificationSettingsSuccess({
                updatedDoc,
              })
            ),
            catchError((error) => {
              console.log(error);
              return of(
                CourseActions.setChannelNotificationSettingsFailure({
                  error,
                })
              );
            })
          )
      )
    );
  });

  setMaterialLevelNotification$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CourseActions.setMaterialNotificationSettings),

      mergeMap((action) =>
        this.notificationService
          .setMaterialNotificationSettings(action.settings)
          .pipe(
            map((updatedDoc: BlockingNotifications) =>
              CourseActions.setMaterialNotificationSettingsSuccess({
                updatedDoc,
              })
            ),
            catchError((error) => {
              console.log(error);
              return of(
                CourseActions.setMaterialNotificationSettingsFailure({
                  error,
                })
              );
            })
          )
      )
    );
  });

  unsetTopicLevelNotification$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CourseActions.unsetTopicNotificationSettings),

      mergeMap((action) =>
        this.notificationService
          .unsetTopicNotificationSettings(action.settings)
          .pipe(
            map((updatedDoc: BlockingNotifications) =>
              CourseActions.unsetTopicNotificationSettingsSuccess({
                updatedDoc,
                /*   infoSentToBackend: action.settings, */
              })
            ),
            catchError((error) => {
              console.log(error);
              return of(
                CourseActions.unsetTopicNotificationSettingsFailure({
                  error,
                })
              );
            })
          )
      )
    );
  });
  unsetChannelLevelNotification$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CourseActions.unsetChannelNotificationSettings),

      mergeMap((action) =>
        this.notificationService
          .unsetChannelNotificationSettings(action.settings)
          .pipe(
            map((updatedDoc: BlockingNotifications) =>
              CourseActions.unsetChannelNotificationSettingsSuccess({
                updatedDoc,
              })
            ),
            catchError((error) => {
              console.log(error);
              return of(
                CourseActions.unsetChannelNotificationSettingsFailure({
                  error,
                })
              );
            })
          )
      )
    );
  });
  unsetMaterialLevelNotification$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CourseActions.unsetMaterialNotificationSettings),

      mergeMap((action) =>
        this.notificationService
          .unsetMaterialNotificationSettings(action.settings)
          .pipe(
            map((updatedDoc: BlockingNotifications) =>
              CourseActions.unsetMaterialNotificationSettingsSuccess({
                updatedDoc,
              })
            ),
            catchError((error) => {
              console.log(error);
              return of(
                CourseActions.unsetMaterialNotificationSettingsFailure({
                  error,
                })
              );
            })
          )
      )
    );
  });
  followAnnotation$ = createEffect(() => {
    
    return this.actions$.pipe(
      ofType(CourseActions.followAnnotation),

      mergeMap((action) =>
        this.notificationService.followAnnotation(action.annotationId).pipe(
          mergeMap((updatedDoc: BlockingNotifications) => [
            CourseActions.followAnnotationSuccess({
              updatedDoc,
            }),
            AppActions.setShowPopupMessage({
              showPopupMessage: true,
              popupMessage:
                'You will now receive notifications for this annotation.',
            }),
          ]),
          catchError((error) => {
            console.log(error);
            return of(
              CourseActions.followAnnotationFailure({
                error,
              })
            );
          })
        )
      )
    );
  });

  unfollowAnnotation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CourseActions.unfollowAnnotation),

      mergeMap((action) =>
        this.notificationService.unfollowAnnotation(action.annotationId).pipe(
          mergeMap((updatedDoc: BlockingNotifications) => [
            CourseActions.unfollowAnnotationSuccess({
              updatedDoc,
            }),
            AppActions.setShowPopupMessage({
              showPopupMessage: true,
              popupMessage:
                'You will now receive no notifications for this annotation.',
            }),
          ]),
          catchError((error) => {
            console.log(error);
            return of(
              CourseActions.unfollowAnnotationFailure({
                error,
              })
            );
          })
        )
      )
    );
  });

  constructor(
    private actions$: Actions,
    private TagService: TagService,
    private loggerService: LoggerService,
    private store: Store<State>,
    private router: Router,
    private annotationService: AnnotationService,
    private notificationService: NotificationsService
  ) {}
}
