import { Component } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, tap } from 'rxjs';
import { CourseNotificationSettings } from 'src/app/models/BlockingNotification';
import {
  courseNotificationSettingLabels,
  globalNotificationSettingsLabels,
} from 'src/app/models/Notification';
import { State } from 'src/app/state/app.state';
import {
  getGlobalNotificationSettings,
  getOverriddenCourses,
} from '../state/notifications.reducer';
import * as NotificationActions from '../state/notifications.actions';
import * as CourseActions from '../../../courses/state/course.actions';
import { getCurrentCourseId } from 'src/app/pages/courses/state/course.reducer';
@Component({
  selector: 'app-global-level-notification-settings',
  templateUrl: './global-level-notification-settings.component.html',
  styleUrls: ['./global-level-notification-settings.component.css'],
})
export class GlobalLevelNotificationSettingsComponent {
  checkBoxesGroup = this.fb.group({});
  checkBoxesArray: { label: string; control: FormControl<boolean> }[] = [];
  overriddenCourses: Observable<CourseNotificationSettings[]>;
  courseNotificationSettingLabels = courseNotificationSettingLabels;

  constructor(private store: Store<State>, protected fb: FormBuilder) {}

  ngOnInit(): void {
    this.store.dispatch(
      NotificationActions.loadGlobalAndCoursesNotificationSettings()
    );
    this.store
      .select(getGlobalNotificationSettings)
      .subscribe((notificationSettings) => {
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

    this.overriddenCourses = this.store
      .select(getOverriddenCourses)
      .pipe(tap((o) => {}));
  }

  onGlobalSettingClicked(notificationOption: {
    label: string;
    control: FormControl<boolean>;
  }): void {
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
    this.store.dispatch(
      CourseActions.unsetCourseNotificationSettings({
        settings: { courseId: course.courseId },
      })
    );
  }

  onCourseSettingClicked(
    notificationSettings: CourseNotificationSettings,
    settingClicked: courseNotificationSettingLabels
  ) {
    let objToSend = {
      courseId: notificationSettings.courseId,

      [courseNotificationSettingLabels.annotations]:
        settingClicked === courseNotificationSettingLabels.annotations
          ? !notificationSettings['isAnnotationNotificationsEnabled']
          : notificationSettings['isAnnotationNotificationsEnabled'],
      [courseNotificationSettingLabels.commentsAndMentioned]:
        settingClicked === courseNotificationSettingLabels.commentsAndMentioned
          ? !notificationSettings['isReplyAndMentionedNotificationsEnabled']
          : notificationSettings['isReplyAndMentionedNotificationsEnabled'],
      [courseNotificationSettingLabels.courseUpdates]:
        settingClicked === courseNotificationSettingLabels.courseUpdates
          ? !notificationSettings['isCourseUpdateNotificationsEnabled']
          : notificationSettings['isCourseUpdateNotificationsEnabled'],
    };

    this.store.dispatch(
      CourseActions.setCourseNotificationSettings({ settings: objToSend })
    );
  }
}
