import { AuthGuardService } from './services/auth-guard.service';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/components/login/login.component';

import { RegistrationComponent } from './pages/components/registration/registration.component';
import { HomeComponent } from './pages/home/home.component';
import { MaterialComponent } from './pages/components/materials/material/material.component';
import { ChannelbarComponent } from './pages/components/channelbar/channelbar.component';
import { CoursesComponent } from './pages/courses/courses.component';
import { TopicDropdownComponent } from './pages/components/topic-dropdown/topic-dropdown.component';
import { PdfMainAnnotationComponent } from './pages/components/annotations/pdf-annotation/pdf-main-annotation/pdf-main-annotation.component';
import { DashboardComponent } from './pages/components/dashboard/dashboard.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { AboutComponent } from './pages/about/about.component';
import { TeamComponent } from './pages/team/team.component';
import { PrivacyComponent } from './pages/components/privacy/privacy.component';
import { CourseDescriptionComponent } from './pages/components/course-description/course-description.component';
import { TagsPageComponent } from './pages/components/tags/tags-page/tags-page.component';
import { CourseWelcomeComponent } from './course-welcome/course-welcome.component';
import { AllNotificationsComponent } from './pages/components/notifications/all-notifications/all-notifications.component';
import { SettingsComponent } from './pages/components/notifications/settings/settings.component';

const routes: Routes = [
  { path: '', redirectTo: 'landingPage', pathMatch: 'full' },
  {
    path: 'landingPage',
    component: LandingPageComponent,
    canActivate: [AuthGuardService],
  },
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
    path: 'about',
    component: AboutComponent,
  },
  {
    path: 'team',
    component: TeamComponent,
  },
  {
    path: 'privacy',
    component: PrivacyComponent,
  },
  {
    path: 'course-description/:courseID',
    component: CourseDescriptionComponent,
  },
  {
    path: 'course/:courseID',
    component: CoursesComponent,
    canActivate: [AuthGuardService],
    children: [
      {
        path: 'channel/:channelId',
        loadChildren: () =>
          import('./pages/components/materials/materials.module').then(
            (m) => m.MaterialsModule
          ),
      },
      {
        path: 'tag/:tagName',
        component: TagsPageComponent,
      },
      {
        path: 'welcome',
        component: CourseWelcomeComponent,
      },
    ],
  },
  { path: 'course/:courseID/dashboard', component: DashboardComponent },
  {
    path: 'notification/all',
    component: AllNotificationsComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AuthGuardService],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
