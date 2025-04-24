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
import { TabMenuComponent } from './tab-menu/tab-menu.component';
import { TabMenuModule } from 'primeng/tabmenu';
import { NoDataComponent } from './no-data/no-data.component';
import { MentionsComponent } from './mentions/mentions.component';
import { MentionModule } from 'angular-mentions';
import { FooterComponent } from './footer/footer.component';
import { AddIndicatorComponent } from './add-indicator/add-indicator.component';
import { PopulateDashboardComponent } from '../pages/components/populate-dashboard/populate-dashboard.component';
import { ByPassUrlSanitizationPipe } from '../pipes/by-pass-url-sanitization.pipe';
import { DragulaModule } from 'ng2-dragula';
import { BackButtonComponent } from '../pages/components/back-button/back-button.component';

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
    TabMenuComponent,
    NoDataComponent,
    MentionsComponent,
    FooterComponent,
    AddIndicatorComponent,
    PopulateDashboardComponent,
    ByPassUrlSanitizationPipe,
    BackButtonComponent,
  ],
  imports: [
    CommonModule,
    PrimengModule,
    ReactiveFormsModule,
    DragulaModule.forRoot(),
    TabMenuModule,
    MentionModule,
  ],
  exports: [
    CommonModule,
    ButtonComponent,
    IconbuttonComponent,
    AvatarComponent,
    SvgIconComponent,
    ContextMenuComponent,
    SidebarComponent,
    AddCourseComponent,
    TabMenuComponent,
    NoDataComponent,
    MentionsComponent,
    FooterComponent,
    AddIndicatorComponent,
    // PopulateDashboardComponent,
    ByPassUrlSanitizationPipe,
    BackButtonComponent,
    PopulateDashboardComponent,
  ],
})
export class SharedComponentsModule {}
