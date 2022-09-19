import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/components/login/login.component';

import { RegistrationComponent } from './pages/components/registration/registration.component';
import { HomeComponent } from './pages/home/home.component';

const routes: Routes = [
  { path: '',   redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'signup',
    component: RegistrationComponent
  },
  {
    
    path: 'login',
    component: LoginComponent
  },
  {
    
    path: 'home',
    component: HomeComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
