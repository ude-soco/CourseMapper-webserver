import { AuthGuardService } from './services/auth-guard.service';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/components/login/login.component';

import { RegistrationComponent } from './pages/components/registration/registration.component';
import { HomeComponent } from './pages/home/home.component';
import { MaterialComponent } from './pages/components/materils/material/material.component';
import { ChannelbarComponent } from './pages/components/channelbar/channelbar.component';
import { CoursesComponent } from './pages/courses/courses.component';
import { TopicDropdownComponent } from './pages/components/topic-dropdown/topic-dropdown.component';
import { PdfMainAnnotationComponent } from './pages/components/annotations/pdf-annotation/pdf-main-annotation/pdf-main-annotation.component';

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
  },

  {
    path: 'course/:courseID',
    component: CoursesComponent,
    children: [
      {
        path: 'channel/:channelId',
        component: TopicDropdownComponent,
        children: [
          { path: 'material/:materialId', component: MaterialComponent },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
