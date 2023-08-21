import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button/button.component';
import { IconbuttonComponent } from './iconbutton/iconbutton.component';
import { AvatarComponent } from './avatar/avatar.component';
import { SvgIconComponent } from './svg-icon/svg-icon.component';
import { ContextMenuComponent } from 'src/app/components/context-menu/context-menu.component';
import { PrimengModule } from '../modules/primeng/primeng.module';
import { ReactiveFormsModule } from '@angular/forms';
import { CourseLevelNotificationSettingsComponent } from './course-level-notification-settings/course-level-notification-settings.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AddCourseComponent } from './add-course/add-course.component';

@NgModule({
  declarations: [
    ButtonComponent,
    IconbuttonComponent,
    AvatarComponent,
    SvgIconComponent,
    ContextMenuComponent,
    CourseLevelNotificationSettingsComponent,
    SidebarComponent,
    AddCourseComponent,
  ],
  imports: [CommonModule, PrimengModule, ReactiveFormsModule],
  exports: [
    ButtonComponent,
    IconbuttonComponent,
    AvatarComponent,
    SvgIconComponent,
    ContextMenuComponent,
    SidebarComponent,
    AddCourseComponent,
  ],
})
export class SharedComponentsModule {}
