import { PrimengModule } from './modules/primeng/primeng.module';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { en_US, NZ_I18N } from 'ng-zorro-antd/i18n';
import { TopicDropdownComponent } from './pages/components/topic-dropdown/topic-dropdown.component';
import { AppRoutingModule } from './app-routing.module';
import { NzFormModule } from 'ng-zorro-antd/form';

import en from '@angular/common/locales/en';

import { AppComponent } from './app.component';
import { SidebarComponent } from './pages/components/sidebar/sidebar.component';
import { NavbarComponent } from './pages/components/navbar/navbar.component';
import { ChannelbarComponent } from './pages/components/channelbar/channelbar.component';
import { CoursesComponent } from './pages/courses/courses.component';
import { ButtonComponent } from './components/button/button.component';
import { IconbuttonComponent } from './components/iconbutton/iconbutton.component';
import { AvatarComponent } from './components/avatar/avatar.component';
import { BadgeModule } from 'primeng/badge';
import { InputSwitchModule } from 'primeng/inputswitch';
import { NotificationDashboardComponent } from './pages/components/notification-dashboard/notification-dashboard.component';
import { SidebarModule } from 'primeng/sidebar';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { TabMenuModule } from 'primeng/tabmenu';
import { MegaMenuModule } from 'primeng/megamenu';

import { MenuItem } from 'primeng/api';
import { MegaMenuItem } from 'primeng/api';

import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { DividerModule } from 'primeng/divider';
import { ContextMenuComponent } from './components/context-menu/context-menu.component';
import { AntUiModule } from './ant-ui/ant-ui.module';
import { NotificationSettingComponent } from './pages/components/notification-setting/notification-setting.component';
import { AllNotificationComponent } from './pages/components/all-notification/all-notification.component';
import { NotificationFilterPanelComponent } from './components/notification-filter-panel/notification-filter-panel.component';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToolbarModule } from 'primeng/toolbar';
import { NotificationSettingItemPanelComponent } from './components/notification-setting-item-panel/notification-setting-item-panel.component';
import { NotificationBoxComponent } from './components/notification-box/notification-box.component';
import { RegistrationComponent } from './pages/components/registration/registration.component';

import { registerLocaleData } from '@angular/common';
import { FormBuilder } from '@angular/forms';
import { LoginComponent } from './pages/components/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { httpInterceptorProviders } from './_helpers/http.interceptor';
import { CustomDatePipe } from './pipes/date.pipe';
import { AnnotationCommentListComponent } from './pages/components/annotation-comment-list/annotation-comment-list.component';
import { AnnotationCommentListItemComponent } from './components/annotation-comment-list-item/annotation-comment-list-item.component';
registerLocaleData(en);
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { HttpClientModule } from '@angular/common/http';
import { AddCourseComponent } from './pages/components/add-course/add-course.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AddTopicComponent } from './pages/components/add-topic/add-topic.component';
import { AddChannelComponent } from './pages/components/add-channel/add-channel.component';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { AnnotationCommentPanelComponent } from './components/annotation-comment-panel/annotation-comment-panel.component';
import { CommentListComponent } from './components/comment-list/comment-list.component';
import { CourseSubscriptionsComponent } from './components/course-subscriptions/course-subscriptions.component';
import { TableModule } from 'primeng/table';
import { MaterialListComponent } from './components/material-list/material-list.component';
import { FilterPipe } from './pipes/filter.pipe';
import { TooltipModule } from 'primeng/tooltip';
import { Ng2SearchPipeModule } from 'ng2-search-filter';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    NavbarComponent,
    ChannelbarComponent,
    CoursesComponent,
    ButtonComponent,
    IconbuttonComponent,
    AvatarComponent,
    NotificationDashboardComponent,
    NotificationBoxComponent,
    ContextMenuComponent,
    NotificationSettingComponent,
    AllNotificationComponent,
    NotificationFilterPanelComponent,
    NotificationSettingItemPanelComponent,
    RegistrationComponent,
    LoginComponent,
    HomeComponent,
    CustomDatePipe,
    AnnotationCommentListComponent,
    AnnotationCommentListItemComponent,
    AddCourseComponent,
    AddTopicComponent,
    AddChannelComponent,
    TopicDropdownComponent,
    AnnotationCommentPanelComponent,
    CommentListComponent,
    CourseSubscriptionsComponent,
    FilterPipe,
    MaterialListComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    PrimengModule,
    BadgeModule,
    InputSwitchModule,
    SidebarModule,
    ButtonModule,
    OverlayPanelModule,
    BrowserAnimationsModule,
    TabMenuModule,
    MegaMenuModule,
    AvatarGroupModule,
    AvatarModule,
    DividerModule,
    MenuModule,
    FormsModule,
    HttpClientModule,
    AntUiModule,
    ReactiveFormsModule,
    DropdownModule,
    InputNumberModule,
    ToolbarModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    PrimengModule,
    HttpClientModule,
    DialogModule,
    ButtonModule,
    BrowserAnimationsModule,
    FormsModule,
    InputTextModule,
    ReactiveFormsModule,
    MenuModule,
    ToastModule,
    RippleModule,
    TableModule,
    Ng2SearchPipeModule,
    TooltipModule,
  ],

  providers: [{ provide: NZ_I18N, useValue: en_US }, httpInterceptorProviders],
  bootstrap: [AppComponent],
})
export class AppModule {}
