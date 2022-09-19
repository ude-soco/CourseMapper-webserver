import { PrimengModule } from './modules/primeng/primeng.module';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
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
import { RegistrationComponent } from './pages/components/registration/registration.component';

import { registerLocaleData } from '@angular/common';

import { FormsModule , FormBuilder,ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './pages/components/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import {httpInterceptorProviders, HttpRequestInterceptor } from  './_helpers/http.interceptor' ;


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
    RegistrationComponent,
    LoginComponent,
    HomeComponent,

    
  ],
  imports: [BrowserModule, AppRoutingModule, PrimengModule, FormsModule,ReactiveFormsModule, HttpClientModule],
  providers: [{ provide: NZ_I18N, useValue: en_US }, httpInterceptorProviders],
  bootstrap: [AppComponent],
})
export class AppModule {}
