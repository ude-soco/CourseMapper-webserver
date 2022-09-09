import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/components/login/login.component';

import { RegistrationComponent } from './pages/components/registration/registration.component';

const routes: Routes = [
  { path: '',   redirectTo: 'signup', pathMatch: 'full' },
  {
    path: 'signup',
    component: RegistrationComponent
  },
  {
    
    path: 'login',
    component: LoginComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
