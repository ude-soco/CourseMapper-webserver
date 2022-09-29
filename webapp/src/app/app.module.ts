import { PrimengModule } from './modules/primeng/primeng.module';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
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
import { ButtonModule } from 'primeng/button';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TabMenuModule } from 'primeng/tabmenu';
import { MenuModule } from 'primeng/menu';
import { MegaMenuModule } from 'primeng/megamenu';

import { MenuItem } from 'primeng/api';
import { MegaMenuItem } from 'primeng/api';

import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { DividerModule } from 'primeng/divider';
import { ContextMenuComponent } from './components/context-menu/context-menu.component';
import { NZ_I18N } from 'ng-zorro-antd/i18n';
import { en_US } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AddCourseComponent } from './components/add-course/add-course.component';
import { AntUiModule } from './ant-ui/ant-ui.module';
import { ReactiveFormsModule } from '@angular/forms';
import { NotificationSettingComponent } from './pages/components/notification-setting/notification-setting.component';
import { AllNotificationComponent } from './pages/components/all-notification/all-notification.component';
import { NotificationFilterPanelComponent } from './components/notification-filter-panel/notification-filter-panel.component';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToolbarModule } from 'primeng/toolbar';
import { NotificationSettingItemPanelComponent } from './components/notification-setting-item-panel/notification-setting-item-panel.component';
import { NotificationBoxComponent } from './components/notification-box/notification-box.component';
import { NotificationItemsComponent } from './pages/components/notification-items/notification-items.component';

registerLocaleData(en);

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
    NotificationItemsComponent,
    NotificationBoxComponent,
    ContextMenuComponent,
    AddCourseComponent,
    NotificationSettingComponent,
    AllNotificationComponent,
    NotificationFilterPanelComponent,
    NotificationSettingItemPanelComponent,
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
  ],
  providers: [{ provide: NZ_I18N, useValue: en_US }],
  bootstrap: [AppComponent],
})
export class AppModule {}
