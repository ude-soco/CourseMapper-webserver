import { Component } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, tap } from 'rxjs';
import { CourseNotificationSettings } from 'src/app/models/BlockingNotification';
import { globalNotificationSettingsLabels } from 'src/app/models/Notification';
import { State } from 'src/app/state/app.state';
import {
  getGlobalNotificationSettings,
  getOverriddenCourses,
} from '../state/notifications.reducer';
import * as NotificationActions from '../state/notifications.actions';
import * as CourseActions from '../../../courses/state/course.actions';
@Component({
  selector: 'app-global-level-notification-settings',
  templateUrl: './global-level-notification-settings.component.html',
  styleUrls: ['./global-level-notification-settings.component.css'],
})
export class GlobalLevelNotificationSettingsComponent {
  checkBoxesGroup = this.fb.group({});
  checkBoxesArray: { label: string; control: FormControl<boolean> }[] = [];
  overriddenCourses: Observable<CourseNotificationSettings[]>;
  globalNotificationSettingsLabels = globalNotificationSettingsLabels;

  constructor(private store: Store<State>, protected fb: FormBuilder) {}

  ngOnInit(): void {
    console.log('GlobalLevelNotificationSettingsComponent.ngOnInit()');
    this.store.dispatch(
      NotificationActions.loadGlobalAndCoursesNotificationSettings()
    );
    this.store
      .select(getGlobalNotificationSettings)
      .subscribe((notificationSettings) => {
        console.log('course notification settings updated!!');
        if (!notificationSettings) return;
        //delete all the controls in the form Group
        this.checkBoxesGroup = this.fb.group({});
        this.checkBoxesArray = [];
        notificationSettings.forEach((o, index) => {
          /*         if (index === 0) {
            this.isResetCourseNotificationsButtonEnabled = o.value;
            return;
          } */
          const control = new FormControl<boolean>(o.value);
          this.checkBoxesArray.push({ label: o.label, control: control });
          this.checkBoxesGroup.addControl(o.label, control);
        });
      });

    this.overriddenCourses = this.store.select(getOverriddenCourses).pipe(
      tap((o) => {
        console.log('overriddenCourses: ', o);
      })
    );
  }

  onGlobalSettingClicked(notificationOption: {
    label: string;
    control: FormControl<boolean>;
  }): void {
    console.log('settings clicked!!');
    const labelClicked: string = notificationOption.label;
    let objToSend = {
      [globalNotificationSettingsLabels.annotations]:
        labelClicked === globalNotificationSettingsLabels.annotations
          ? !this.checkBoxesGroup.value[
              globalNotificationSettingsLabels.annotations
            ]
          : this.checkBoxesGroup.value[
              globalNotificationSettingsLabels.annotations
            ],
      [globalNotificationSettingsLabels.commentsAndMentioned]:
        labelClicked === globalNotificationSettingsLabels.commentsAndMentioned
          ? !this.checkBoxesGroup.value[
              globalNotificationSettingsLabels.commentsAndMentioned
            ]
          : this.checkBoxesGroup.value[
              globalNotificationSettingsLabels.commentsAndMentioned
            ],
      [globalNotificationSettingsLabels.courseUpdates]:
        labelClicked === globalNotificationSettingsLabels.courseUpdates
          ? !this.checkBoxesGroup.value[
              globalNotificationSettingsLabels.courseUpdates
            ]
          : this.checkBoxesGroup.value[
              globalNotificationSettingsLabels.courseUpdates
            ],
    };

    this.store.dispatch(
      NotificationActions.setGlobalNotificationSettings(objToSend)
    );
  }

  onRemoveCourse(course: CourseNotificationSettings) {
    console.log('remove course clicked!!');
    console.log('course: ', course);
    this.store.dispatch(
      CourseActions.unsetCourseNotificationSettings({
        settings: { courseId: course.courseId },
      })
    );
  }

  /*   onTopicSettingClicked(
    notificationSettings: TopicNotificationSettings,
    settingClicked: topicNotificationSettingLabels
  ) {
    console.log('topic setting clicked!!');
    console.log('notificationSettings: ', notificationSettings);
    console.log('settingClicked: ', settingClicked);
    this.store.select(getCurrentCourseId).subscribe((courseId) => {
      let objToSend = {
        courseId,
        topicId: notificationSettings.topicId,
        [topicNotificationSettingLabels.annotations]:
          settingClicked === topicNotificationSettingLabels.annotations
            ? !notificationSettings['isAnnotationNotificationsEnabled']
            : notificationSettings['isAnnotationNotificationsEnabled'],
        [topicNotificationSettingLabels.commentsAndMentioned]:
          settingClicked === topicNotificationSettingLabels.commentsAndMentioned
            ? !notificationSettings['isReplyAndMentionedNotificationsEnabled']
            : notificationSettings['isReplyAndMentionedNotificationsEnabled'],
        [topicNotificationSettingLabels.topicUpdates]:
          settingClicked === topicNotificationSettingLabels.topicUpdates
            ? !notificationSettings['isCourseUpdateNotificationsEnabled']
            : notificationSettings['isCourseUpdateNotificationsEnabled'],
      };

      this.store.dispatch(
        CourseActions.setTopicNotificationSettings({ settings: objToSend })
      );
    });
  } */

  /*   onRemoveTopic(notificationOption: TopicNotificationSettings) {
    console.log('remove topic clicked!!');
    console.log('notificationOption: ', notificationOption);
    this.store.select(getCurrentCourseId).subscribe((courseId) => {
      let objToSend = {
        courseId,
        topicId: notificationOption.topicId,
      };

      this.store.dispatch(
        CourseActions.unsetTopicNotificationSettings({
          settings: objToSend,
        })
      );
    });
  } */
}
