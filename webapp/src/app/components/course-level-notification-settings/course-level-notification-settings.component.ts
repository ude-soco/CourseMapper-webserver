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
    console.log('reset button clicked!!');
  }

  onSettingsClicked(notificationOption: {
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
}
