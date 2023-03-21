import { PrimengModule } from './modules/primeng/primeng.module';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { TopicDropdownComponent } from './pages/components/topic-dropdown/topic-dropdown.component';

import { AppRoutingModule } from './app-routing.module';

import en from '@angular/common/locales/en';

import { AppComponent } from './app.component';
import { SidebarComponent } from './pages/components/sidebar/sidebar.component';
import { NavbarComponent } from './pages/components/navbar/navbar.component';
import { ChannelbarComponent } from './pages/components/channelbar/channelbar.component';
import { CoursesComponent } from './pages/courses/courses.component';
import { ButtonComponent } from './components/button/button.component';
import { IconbuttonComponent } from './components/iconbutton/iconbutton.component';
import { AvatarComponent } from './components/avatar/avatar.component';
import { EditorComponent } from './pages/components/editor/editor.component';
import {InputTextareaModule} from 'primeng/inputtextarea';
import { DashboardComponent } from './pages/components/dashboard/dashboard.component';
import { ByPassUrlSanitizationPipe } from './pipes/by-pass-url-sanitization.pipe';
import { DragulaModule } from 'ng2-dragula';
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

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './pages/components/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import {
  httpInterceptorProviders,
} from './_helpers/http.interceptor';
import { StoreModule, MetaReducer  } from '@ngrx/store';
import { AnnotationModule } from './pages/components/annotations/annotation.module';
import { MaterialsModule } from './pages/components/materils/materials.module';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { SharedComponentsModule } from './components/shared-components.module';
import { appReducer } from './state/app.reducer';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
const config: SocketIoConfig = { url: 'http://localhost:8080', options: {} };
import { hydrationMetaReducer} from "./state/hydration.reducer";
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
 
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
        AnnotationModule,
        MaterialsModule,
        EffectsModule.forRoot([]),
        StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: environment.production }),
        SharedComponentsModule,
        StoreModule.forFeature('general', appReducer),
        InputTextareaModule,
        DragulaModule.forRoot(),
        SocketIoModule.forRoot(config)

    ],
    providers: [httpInterceptorProviders],
    bootstrap: [AppComponent],
})
export class AppModule {}
