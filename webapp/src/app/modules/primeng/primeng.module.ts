import { NgModule } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import {TabViewModule} from 'primeng/tabview';

const PrimeNgComponents = [
  AvatarModule,
  AvatarGroupModule,
  InputTextModule,
  ButtonModule,
  PasswordModule,
  TabViewModule
];

@NgModule({
  imports: [PrimeNgComponents],
  exports: [PrimeNgComponents],
})
export class PrimengModule {}
