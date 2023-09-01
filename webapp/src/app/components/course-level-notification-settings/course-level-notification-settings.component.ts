import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { State } from 'src/app/state/app.state';
import { Store } from '@ngrx/store';
import {
  getNotificationSettingsOfCurrentCourse,
  getCurrentCourseId,
  getOverriddenChannelsMaterialsTopics,
} from 'src/app/pages/courses/state/course.reducer';
import { courseNotificationSettingLabels } from 'src/app/models/Notification';
import * as CourseActions from 'src/app/pages/courses/state/course.actions';
import { Observable, tap } from 'rxjs';
import {
  ChannelNotificationSettings,
  MaterialNotificationSettings,
  TopicNotificationSettings,
} from 'src/app/models/BlockingNotification';

import {
  topicNotificationSettingLabels,
  channelNotificationSettingLabels,
  materialNotificationSettingLabels,
} from 'src/app/models/Notification';
@Component({
  selector: 'app-course-level-notification-settings',
  templateUrl: './course-level-notification-settings.component.html',
  styleUrls: ['./course-level-notification-settings.component.css'],
})
export class CourseLevelNotificationSettingsComponent implements OnInit {
  checkBoxesGroup = this.fb.group({});
  checkBoxesArray: { label: string; control: FormControl<boolean> }[] = [];
  isResetCourseNotificationsButtonEnabled: boolean;
  overriddenChannelTopicMaterialNotificationSettings: Observable<
    (
      | MaterialNotificationSettings
      | ChannelNotificationSettings
      | TopicNotificationSettings
    )[]
  >;
  topicNotificationSettingLabels = topicNotificationSettingLabels;
  channelNotificationSettingLabels = channelNotificationSettingLabels;
  materialNotificationSettingLabels = materialNotificationSettingLabels;

  constructor(private store: Store<State>, protected fb: FormBuilder) {}

  ngOnInit(): void {
    console.log('CourseLevelNotificationSettingsComponent.ngOnInit()');
    this.store
      .select(getNotificationSettingsOfCurrentCourse)
      .subscribe((notificationSettings) => {
        console.log('course notification settings updated!!');
        if (!notificationSettings) return;
        //delete all the controls in the form Group
        this.checkBoxesGroup = this.fb.group({});
        this.checkBoxesArray = [];
        notificationSettings.forEach((o, index) => {
          if (index === 0) {
            this.isResetCourseNotificationsButtonEnabled = o.value;
            return;
          }
          const control = new FormControl<boolean>(o.value);
          this.checkBoxesArray.push({ label: o.label, control: control });
          this.checkBoxesGroup.addControl(o.label, control);
        });
      });

    this.overriddenChannelTopicMaterialNotificationSettings = this.store
      .select(getOverriddenChannelsMaterialsTopics)
      .pipe(
        tap((o) => {
          console.log(
            'overriddenChannelTopicMaterialNotificationSettings: ',
            o
          );
        })
      );
  }

  onResetButtonClicked() {
    this.store.select(getCurrentCourseId).subscribe((courseId) => {
      let objToSend = {
        courseId,
      };

      this.store.dispatch(
        CourseActions.unsetCourseNotificationSettings({
          settings: objToSend,
        })
      );
    });
  }

  onCourseSettingClicked(notificationOption: {
    label: string;
    control: FormControl<boolean>;
  }): void {
    console.log('settings clicked!!');
    this.store.select(getCurrentCourseId).subscribe((courseId) => {
      console.log('courseId: ', courseId);
      const labelClicked: string = notificationOption.label;
      let objToSend = {
        courseId,

        [courseNotificationSettingLabels.annotations]:
          labelClicked === courseNotificationSettingLabels.annotations
            ? !this.checkBoxesGroup.value[
                courseNotificationSettingLabels.annotations
              ]
            : this.checkBoxesGroup.value[
                courseNotificationSettingLabels.annotations
              ],
        [courseNotificationSettingLabels.commentsAndMentioned]:
          labelClicked === courseNotificationSettingLabels.commentsAndMentioned
            ? !this.checkBoxesGroup.value[
                courseNotificationSettingLabels.commentsAndMentioned
              ]
            : this.checkBoxesGroup.value[
                courseNotificationSettingLabels.commentsAndMentioned
              ],
        [courseNotificationSettingLabels.courseUpdates]:
          labelClicked === courseNotificationSettingLabels.courseUpdates
            ? !this.checkBoxesGroup.value[
                courseNotificationSettingLabels.courseUpdates
              ]
            : this.checkBoxesGroup.value[
                courseNotificationSettingLabels.courseUpdates
              ],
      };

      this.store.dispatch(
        CourseActions.setCourseNotificationSettings({ settings: objToSend })
      );
    });
  }

  onTopicSettingClicked(
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
  }

  onRemoveTopic(notificationOption: TopicNotificationSettings) {
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
  }

  onRemoveChannel(notificationOption: ChannelNotificationSettings) {
    console.log('remove channel clicked!!');
    console.log('notificationOption: ', notificationOption);
    this.store.select(getCurrentCourseId).subscribe((courseId) => {
      let objToSend = {
        courseId,
        channelId: notificationOption.channelId,
      };

      this.store.dispatch(
        CourseActions.unsetChannelNotificationSettings({
          settings: objToSend,
        })
      );
    });
  }

  onRemoveMaterial(notificationOption: MaterialNotificationSettings) {
    console.log('remove material clicked!!');
    console.log('notificationOption: ', notificationOption);
    this.store.select(getCurrentCourseId).subscribe((courseId) => {
      let objToSend = {
        courseId,
        materialId: notificationOption.materialId,
      };

      this.store.dispatch(
        CourseActions.unsetMaterialNotificationSettings({
          settings: objToSend,
        })
      );
    });
  }

  onChannelSettingClicked(
    notificationSettings: ChannelNotificationSettings,
    settingClicked: channelNotificationSettingLabels
  ) {
    console.log('channel setting clicked!!');
    console.log('notificationSettings: ', notificationSettings);
    console.log('settingClicked: ', settingClicked);
    this.store.select(getCurrentCourseId).subscribe((courseId) => {
      let objToSend = {
        courseId,
        channelId: notificationSettings.channelId,
        [channelNotificationSettingLabels.annotations]:
          settingClicked === channelNotificationSettingLabels.annotations
            ? !notificationSettings['isAnnotationNotificationsEnabled']
            : notificationSettings['isAnnotationNotificationsEnabled'],
        [channelNotificationSettingLabels.commentsAndMentioned]:
          settingClicked ===
          channelNotificationSettingLabels.commentsAndMentioned
            ? !notificationSettings['isReplyAndMentionedNotificationsEnabled']
            : notificationSettings['isReplyAndMentionedNotificationsEnabled'],
        [channelNotificationSettingLabels.channelUpdates]:
          settingClicked === channelNotificationSettingLabels.channelUpdates
            ? !notificationSettings['isCourseUpdateNotificationsEnabled']
            : notificationSettings['isCourseUpdateNotificationsEnabled'],
      };

      this.store.dispatch(
        CourseActions.setChannelNotificationSettings({ settings: objToSend })
      );
    });
  }

  onMaterialSettingClicked(
    notificationSettings: MaterialNotificationSettings,
    settingClicked: materialNotificationSettingLabels
  ) {
    console.log('material setting clicked!!');
    console.log('notificationSettings: ', notificationSettings);
    console.log('settingClicked: ', settingClicked);
    this.store.select(getCurrentCourseId).subscribe((courseId) => {
      let objToSend = {
        courseId,
        materialId: notificationSettings.materialId,
        [materialNotificationSettingLabels.annotations]:
          settingClicked === materialNotificationSettingLabels.annotations
            ? !notificationSettings['isAnnotationNotificationsEnabled']
            : notificationSettings['isAnnotationNotificationsEnabled'],
        [materialNotificationSettingLabels.commentsAndMentioned]:
          settingClicked ===
          materialNotificationSettingLabels.commentsAndMentioned
            ? !notificationSettings['isReplyAndMentionedNotificationsEnabled']
            : notificationSettings['isReplyAndMentionedNotificationsEnabled'],
        [materialNotificationSettingLabels.materialUpdates]:
          settingClicked === materialNotificationSettingLabels.materialUpdates
            ? !notificationSettings['isCourseUpdateNotificationsEnabled']
            : notificationSettings['isCourseUpdateNotificationsEnabled'],
      };

      this.store.dispatch(
        CourseActions.setMaterialNotificationSettings({ settings: objToSend })
      );
    });
  }
}
