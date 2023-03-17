import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button/button.component';
import { IconbuttonComponent } from './iconbutton/iconbutton.component';
import { AvatarComponent } from './avatar/avatar.component';



@NgModule({
  declarations: [
    ButtonComponent,
    IconbuttonComponent,
    AvatarComponent,
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ButtonComponent,
    IconbuttonComponent,
    AvatarComponent,
  ]
})
export class SharedComponentsModule { }
