import { AuthGuardService } from './services/auth-guard.service';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/components/login/login.component';

import { RegistrationComponent } from './pages/components/registration/registration.component';
import { HomeComponent } from './pages/home/home.component';
import { MaterialComponent } from './pages/components/materils/material/material.component';
import { ChannelbarComponent } from './pages/components/channelbar/channelbar.component';
import { CoursesComponent } from './pages/courses/courses.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'signup',
    component: RegistrationComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuardService],
   /* children: [
      {
        //path: 'home/material',  // child route path
       // title: resolvedChildATitle,
        //component: MaterialComponent,  // child route component that the router renders
        path: 'channel/:channelId', component: ChannelbarComponent,
      },
     
    ],*/
  },
  //{path: 'channel/:channelId', component: ChannelbarComponent},
 // {path: 'home/channel', component: ChannelbarComponent},
 //{path: 'course/:channelId', component: CoursesComponent},
 {path: 'course/:courseID', component: CoursesComponent},
  /*{
    path: 'channel',
    component: ChannelbarComponent,
    canActivate: [AuthGuardService],
  },*/
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
