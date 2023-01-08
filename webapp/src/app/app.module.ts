import { PrimengModule } from './modules/primeng/primeng.module';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { TopicDropdownComponent } from './pages/components/topic-dropdown/topic-dropdown.component';
import { en_US, NZ_I18N } from 'ng-zorro-antd/i18n';
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
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InputTextModule } from 'primeng/inputtext';
import { HttpClientModule } from '@angular/common/http';
import { AddCourseComponent } from './pages/components/add-course/add-course.component';
import { AddTopicComponent } from './pages/components/add-topic/add-topic.component';
import { AddChannelComponent } from './pages/components/add-channel/add-channel.component';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RegistrationComponent } from './pages/components/registration/registration.component';

import { registerLocaleData } from '@angular/common';

import { FormsModule, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './pages/components/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import {
  httpInterceptorProviders,
  HttpRequestInterceptor,
} from './_helpers/http.interceptor';
import { MaterialComponent } from './pages/components/materils/material/material.component';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { AddMaterialComponent } from './pages/components/materils/add-material/add-material.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ViewPdfComponent } from './pages/components/materils/view-pdf/view-pdf.component';
import { PdfAnnotationToolbarComponent } from './pages/components/annotations/pdf-annotation/pdf-annotation-toolbar/pdf-annotation-toolbar.component';
import { PdfCreateAnnotationComponent } from './pages/components/annotations/pdf-annotation/pdf-create-annotation/pdf-create-annotation.component';
import { PdfCommentPanelComponent } from './pages/components/annotations/pdf-annotation/pdf-comment-panel/pdf-comment-panel.component';
import { PdfCommentItemComponent } from './pages/components/annotations/pdf-annotation/pdf-comment-item/pdf-comment-item.component';
import { PdfMainAnnotationComponent } from './pages/components/annotations/pdf-annotation/pdf-main-annotation/pdf-main-annotation.component';
import { StoreModule } from '@ngrx/store';
import { AnnotationModule } from './pages/components/annotations/pdf-annotation/annotation.module';
import { MaterialsModule } from './pages/components/materils/materials.module';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';

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
    AddCourseComponent,
    AddTopicComponent,
    AddChannelComponent,
    TopicDropdownComponent,
    RegistrationComponent,
    LoginComponent,
    HomeComponent
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
    MatInputModule,
    MatTabsModule,
    StoreModule.forRoot({}, {}),
    AnnotationModule,
    MaterialsModule,
    EffectsModule.forRoot([]),
    StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: environment.production })
  ],
  providers: [{ provide: NZ_I18N, useValue: en_US }, httpInterceptorProviders],
  bootstrap: [AppComponent],
})
export class AppModule {}
