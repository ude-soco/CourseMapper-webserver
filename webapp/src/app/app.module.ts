//TODO: angular.json: the default configuration was changed to development
//TODO: package.json, playing around with the scripts
//TODO: delete data.json
import en from '@angular/common/locales/en';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { registerLocaleData, DatePipe } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';

import { MetaReducer, StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { PrimengModule } from "./modules/primeng/primeng.module";
import { SharedComponentsModule } from "./components/shared-components.module";
import { ButtonComponent } from './components/button/button.component';
import { IconbuttonComponent } from './components/iconbutton/iconbutton.component';
import { AvatarComponent } from './components/avatar/avatar.component';

import { InputTextareaModule } from 'primeng/inputtextarea';
import { DragulaModule,  DragulaService } from 'ng2-dragula';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { ByPassUrlSanitizationPipe } from './pipes/by-pass-url-sanitization.pipe';
import { CustomDatePipe } from './pipes/date.pipe';



import { AppComponent } from "./app.component";
import { TopicDropdownComponent } from "./pages/components/topic-dropdown/topic-dropdown.component";

import { RegistrationComponent } from "./pages/components/registration/registration.component";
import { NavbarComponent } from "./pages/components/navbar/navbar.component";
import { ChannelbarComponent } from "./pages/components/channelbar/channelbar.component";
import { CoursesComponent } from "./pages/courses/courses.component";
import { EditorComponent } from "./pages/components/editor/editor.component";
import { AddCourseComponent } from "./components/add-course/add-course.component";
import { AddTopicComponent } from "./pages/components/add-topic/add-topic.component";
import { AddChannelComponent } from "./pages/components/add-channel/add-channel.component";
import { SidebarTagsComponent } from "./pages/components/tags/sidebar-tags/sidebar-tags.component";
import { TagsPageComponent } from "./pages/components/tags/tags-page/tags-page.component";
import { TagCommentItemComponent } from "./pages/components/tags/tag-comment-item/tag-comment-item.component";
import { TagReplyPanelComponent } from "./pages/components/tags/tag-reply-panel/tag-reply-panel.component";
import { TagReplyItemComponent } from "./pages/components/tags/tag-reply-item/tag-reply-item.component";


import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './pages/components/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { httpInterceptorProviders } from './_helpers/http.interceptor';
import { AnnotationModule } from './pages/components/annotations/annotation.module';
// import { MaterialsModule } from './pages/components/materils/materials.module';
import { environment } from '../environments/environment';
import { appReducer } from './state/app.reducer';
import { SocketIoModule } from 'ngx-socket-io';
import { hydrationMetaReducer } from './state/hydration.reducer';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { PrivacyComponent } from './pages/components/privacy/privacy.component';

import { CourseModule } from './pages/courses/course.module';
import { CourseDescriptionComponent } from './pages/components/course-description/course-description.component';
import { KnowledgeGraphModule } from './pages/components/knowledge-graph/knowledge-graph.module';
import {ChatComponent} from "./components/chat/chat.component";
import {SafeHtmlPipe} from "./pipes/safehtml.pipe";
import {DateAgoPipe} from "./pipes/date-ago.pipe";
import {LinkifyPipe} from "./pipes/linkify.pipe";


import { TabMenuModule } from 'primeng/tabmenu';
import { NotificationModule } from './pages/components/notifications/notification.module';
import { CourseWelcomeComponent } from './course-welcome/course-welcome.component';
export const metaReducers: MetaReducer[] = [hydrationMetaReducer];
registerLocaleData(en);
import { DividerModule } from 'primeng/divider';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { SettingsComponent } from './pages/components/notifications/settings/settings.component';
import { NoDataComponent } from './components/no-data/no-data.component';
import { AppEffects } from './state/app.effects';
import { MentionModule } from 'angular-mentions';
import { MessageService } from 'primeng/api';
import { TeamComponent } from './pages/team/team.component';
import { AboutComponent } from './pages/about/about.component';
import { ForgetPasswordComponent } from './pages/components/forget-password/forget-password.component';
import { ResetPasswordComponent } from './pages/components/forget-password/reset-password/reset-password.component';
import { ResetPasswordRequestComponent } from './pages/components/forget-password/reset-password-request/reset-password-request.component';

import { PersonalDashboardComponent } from './pages/components/Dashboards/personal-dashboard/personal-dashboard.component';
import { PopulateDashboardComponent } from './pages/components/populate-dashboard/populate-dashboard.component';
import { TopicDashboardComponent } from './pages/components/Dashboards/topic-dashboard/topic-dashboard.component';
import { CourseDashboardComponent } from './pages/components/Dashboards/course-dashboard/course-dashboard.component';
import { ChannelDashboardComponent } from './pages/components/Dashboards/channel-dashboard/channel-dashboard.component';
import { MaterialDashboardComponent } from './pages/components/Dashboards/material-dashboard/material-dashboard.component';
import { BackButtonComponent } from './pages/components/back-button/back-button.component';
import { VisLandingPageComponent } from './pages/vis-dashboard/vis-landing-page/vis-landing-page.component';
import { VisDashboardLayoutComponent } from './pages/components/vis-dashboard/vis-dashboard-layout/vis-dashboard-layout.component';
import { VisHeaderComponent } from './pages/components/vis-dashboard/vis-header/vis-header.component';
import { CourseCategoryComponent } from './pages/components/vis-dashboard/cards/course-category/course-category.component';
import { CourseCarouselComponent } from './pages/components/vis-dashboard/carousel/course-carousel/course-carousel.component';
import { CourseComponent } from './pages/components/vis-dashboard/cards/course/course.component';
import { VisOptionsComponent } from './pages/components/vis-dashboard/cards/vis-options/vis-options.component';
import { VisExplorePageComponent } from './pages/vis-dashboard/vis-explore-page/vis-explore-page.component';
import { VisComparePageComponent } from './pages/vis-dashboard/vis-compare-page/vis-compare-page.component';
import { FindTopicPageComponent } from './pages/vis-dashboard/find-topic-page/find-topic-page.component';
import { CourseDetailsPageComponent } from './pages/vis-dashboard/course-details-page/course-details-page.component';
import { PlatformTabsComponent } from './pages/components/vis-dashboard/platform-tabs/platform-tabs.component';
@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    ChannelbarComponent,
    CoursesComponent,
    AddTopicComponent,
    AddChannelComponent,
    TopicDropdownComponent,
    RegistrationComponent,
    LoginComponent,
    HomeComponent,
    EditorComponent,
    //ByPassUrlSanitizationPipe,
    LandingPageComponent,
    PrivacyComponent,
    CourseDescriptionComponent,
    SidebarTagsComponent,
    TagsPageComponent,
    TagCommentItemComponent,
    TagReplyPanelComponent,
    TagReplyItemComponent,
    ChatComponent,
    SafeHtmlPipe,
    DateAgoPipe,
    LinkifyPipe,
    CourseWelcomeComponent,
    TeamComponent,
    AboutComponent,
    ForgetPasswordComponent,
    ResetPasswordComponent,
    ResetPasswordRequestComponent,

    PersonalDashboardComponent,
    TopicDashboardComponent,
    CourseDashboardComponent,
    ChannelDashboardComponent,
   PopulateDashboardComponent,
   MaterialDashboardComponent,
   BackButtonComponent,
   VisLandingPageComponent,
   VisDashboardLayoutComponent,
   VisHeaderComponent,
   CourseCategoryComponent,
   CourseCarouselComponent,
   CourseComponent,
   VisOptionsComponent,
   VisExplorePageComponent,
   VisComparePageComponent,
   FindTopicPageComponent,
   CourseDetailsPageComponent,
   PlatformTabsComponent
  ],
  imports: [
    MentionModule,
    DynamicDialogModule,
    MenuModule,
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
    ToastModule,
    RippleModule,
    ConfirmDialogModule,
    NotificationModule,
    StoreModule.forRoot({}, {}),
    EffectsModule.forRoot([]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production,
    }),
    SharedComponentsModule,
    StoreModule.forFeature('general', appReducer),
    EffectsModule.forFeature([AppEffects]),
    InputTextareaModule,
    DragulaModule.forRoot(),
    SocketIoModule.forRoot(environment.socketConfig),
    CourseModule,
    KnowledgeGraphModule,
    TabMenuModule,
    DividerModule,
  ],
  exports: [],
  providers: [httpInterceptorProviders, DatePipe],
  bootstrap: [AppComponent],
})
export class AppModule {}
