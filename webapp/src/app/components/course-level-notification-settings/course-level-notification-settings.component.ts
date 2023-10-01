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
import { Observable, Subscription, tap } from 'rxjs';
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
  courseId: string;
  courseIdSubscription: Subscription;

  constructor(private store: Store<State>, protected fb: FormBuilder) {}

  ngOnInit(): void {
    console.log('CourseLevelNotificationSettingsComponent.ngOnInit()');
    this.store
      .select(getNotificationSettingsOfCurrentCourse)
      .subscribe((notificationSettings) => {
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

    this.courseIdSubscription = this.store
      .select(getCurrentCourseId)
      .subscribe((courseId) => {
        this.courseId = courseId;
      });
  }

  onResetButtonClicked() {
    let objToSend = {
      courseId: this.courseId,
    };

    this.store.dispatch(
      CourseActions.unsetCourseNotificationSettings({
        settings: objToSend,
      })
    );
  }

  onCourseSettingClicked(notificationOption: {
    label: string;
    control: FormControl<boolean>;
  }): void {
    const labelClicked: string = notificationOption.label;
    let objToSend = {
      courseId: this.courseId,

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
  }

  onTopicSettingClicked(
    notificationSettings: TopicNotificationSettings,
    settingClicked: topicNotificationSettingLabels
  ) {
    let objToSend = {
      courseId: this.courseId,
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
  }

  onRemoveTopic(notificationOption: TopicNotificationSettings) {
    let objToSend = {
      courseId: this.courseId,
      topicId: notificationOption.topicId,
    };

    this.store.dispatch(
      CourseActions.unsetTopicNotificationSettings({
        settings: objToSend,
      })
    );
  }

  onRemoveChannel(notificationOption: ChannelNotificationSettings) {
    let objToSend = {
      courseId: this.courseId,
      channelId: notificationOption.channelId,
    };

    this.store.dispatch(
      CourseActions.unsetChannelNotificationSettings({
        settings: objToSend,
      })
    );
  }

  onRemoveMaterial(notificationOption: MaterialNotificationSettings) {
    let objToSend = {
      courseId: this.courseId,
      materialId: notificationOption.materialId,
    };

    this.store.dispatch(
      CourseActions.unsetMaterialNotificationSettings({
        settings: objToSend,
      })
    );
  }

  onChannelSettingClicked(
    notificationSettings: ChannelNotificationSettings,
    settingClicked: channelNotificationSettingLabels
  ) {
    let objToSend = {
      courseId: this.courseId,
      channelId: notificationSettings.channelId,
      [channelNotificationSettingLabels.annotations]:
        settingClicked === channelNotificationSettingLabels.annotations
          ? !notificationSettings['isAnnotationNotificationsEnabled']
          : notificationSettings['isAnnotationNotificationsEnabled'],
      [channelNotificationSettingLabels.commentsAndMentioned]:
        settingClicked === channelNotificationSettingLabels.commentsAndMentioned
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
  }

  onMaterialSettingClicked(
    notificationSettings: MaterialNotificationSettings,
    settingClicked: materialNotificationSettingLabels
  ) {
    let objToSend = {
      courseId: this.courseId,
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
  }

  ngOnDestroy(): void {
    if (this.courseIdSubscription) {
      this.courseIdSubscription.unsubscribe();
    }
  }
}
