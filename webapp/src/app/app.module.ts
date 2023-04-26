import en from '@angular/common/locales/en';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';

import { MetaReducer, StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { PrimengModule } from './modules/primeng/primeng.module';
import { SharedComponentsModule } from './components/shared-components.module';

import { InputTextareaModule } from 'primeng/inputtextarea';
import { DragulaModule } from 'ng2-dragula';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { ByPassUrlSanitizationPipe } from './pipes/by-pass-url-sanitization.pipe';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { httpInterceptorProviders } from './_helpers/http.interceptor';
import { SocketIoModule } from 'ngx-socket-io';

import { appReducer } from './state/app.reducer';
import { hydrationMetaReducer } from './state/hydration.reducer';

import { AppComponent } from './app.component';
import { TopicDropdownComponent } from './pages/components/topic-dropdown/topic-dropdown.component';
import { DashboardComponent } from './pages/components/dashboard/dashboard.component';
import { RegistrationComponent } from './pages/components/registration/registration.component';
import { SidebarComponent } from './pages/components/sidebar/sidebar.component';
import { NavbarComponent } from './pages/components/navbar/navbar.component';
import { ChannelbarComponent } from './pages/components/channelbar/channelbar.component';
import { CoursesComponent } from './pages/courses/courses.component';
import { EditorComponent } from './pages/components/editor/editor.component';
import { LoginComponent } from './pages/components/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { AddCourseComponent } from './pages/components/add-course/add-course.component';
import { AddTopicComponent } from './pages/components/add-topic/add-topic.component';
import { AddChannelComponent } from './pages/components/add-channel/add-channel.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { PrivacyComponent } from './pages/components/privacy/privacy.component';
import { CourseModule } from './pages/courses/course.module';
import { CourseDescriptionComponent } from './pages/components/course-description/course-description.component';

import { environment } from '../environments/environment';

export const metaReducers: MetaReducer[] = [hydrationMetaReducer];
registerLocaleData(en);

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    NavbarComponent,
    ChannelbarComponent,
    CoursesComponent,
    AddCourseComponent,
    AddTopicComponent,
    AddChannelComponent,
    TopicDropdownComponent,
    RegistrationComponent,
    LoginComponent,
    HomeComponent,
    EditorComponent,
    DashboardComponent,
    ByPassUrlSanitizationPipe,
    LandingPageComponent,
    PrivacyComponent,
    CourseDescriptionComponent,
  ],
  imports: [
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
    ConfirmDialogModule,
    StoreModule.forRoot({}, {}),
    EffectsModule.forRoot([]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production,
    }),
    SharedComponentsModule,
    StoreModule.forFeature('general', appReducer),
    InputTextareaModule,
    DragulaModule.forRoot(),
    SocketIoModule.forRoot({
      url: `http://localhost:8080`,
      options: {
        path: '/api/socket.io',
        transports: ['websocket'],
      },
    }),
    CourseModule,
  ],
  exports: [SidebarComponent],

  providers: [httpInterceptorProviders],
  bootstrap: [AppComponent],
})
export class AppModule {}
