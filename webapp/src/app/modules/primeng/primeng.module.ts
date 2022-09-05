import { NgModule } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';

const PrimeNgComponents = [AvatarModule, AvatarGroupModule];

@NgModule({
  imports: [PrimeNgComponents],
  exports: [PrimeNgComponents],
})
export class PrimengModule {}
