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
  ],
  imports: [BrowserModule, AppRoutingModule, PrimengModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
