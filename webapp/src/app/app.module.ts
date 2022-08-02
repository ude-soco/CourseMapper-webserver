import { PrimengModule } from './modules/primeng/primeng.module';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ChannelbarComponent } from './components/channelbar/channelbar.component';

@NgModule({
  declarations: [AppComponent, SidebarComponent, NavbarComponent, ChannelbarComponent],
  imports: [BrowserModule, AppRoutingModule, PrimengModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
