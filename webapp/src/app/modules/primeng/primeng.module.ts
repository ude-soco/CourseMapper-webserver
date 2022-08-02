import { NgModule } from '@angular/core';
import { ButtonModule } from 'primeng/button';

const PrimeNgComponents = [ButtonModule];

@NgModule({
  imports: [PrimeNgComponents],
  exports: [PrimeNgComponents],
})
export class PrimengModule {}
