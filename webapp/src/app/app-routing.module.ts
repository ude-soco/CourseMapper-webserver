import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AllNotificationComponent } from './pages/components/all-notification/all-notification.component';
import { NotificationSettingComponent } from './pages/components/notification-setting/notification-setting.component';
import { CoursesComponent } from './pages/courses/courses.component';

const routes: Routes = [
  { path: 'notification-settings', component: NotificationSettingComponent },
  { path: '', component: CoursesComponent },
  { path: 'allNotification', component: AllNotificationComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
