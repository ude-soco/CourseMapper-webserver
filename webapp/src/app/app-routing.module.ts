import { AuthGuardService } from './services/auth-guard.service';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AllNotificationComponent } from './pages/components/all-notification/all-notification.component';
import { NotificationSettingComponent } from './pages/components/notification-setting/notification-setting.component';
import { CoursesComponent } from './pages/courses/courses.component';

import { LoginComponent } from './pages/components/login/login.component';

import { RegistrationComponent } from './pages/components/registration/registration.component';
import { HomeComponent } from './pages/home/home.component';

const routes: Routes = [
  // { path: '', redirectTo: 'login', pathMatch: 'full' },
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
  { path: 'notification-settings', component: NotificationSettingComponent },
  { path: '', component: CoursesComponent },
  { path: 'allNotification', component: AllNotificationComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
