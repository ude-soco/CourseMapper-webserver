import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button/button.component';
import { IconbuttonComponent } from './iconbutton/iconbutton.component';
import { AvatarComponent } from './avatar/avatar.component';
import { SvgIconComponent } from './svg-icon/svg-icon.component';

@NgModule({
  declarations: [
    ButtonComponent,
    IconbuttonComponent,
    AvatarComponent,
    SvgIconComponent,
  ],
  imports: [CommonModule],
  exports: [
    ButtonComponent,
    IconbuttonComponent,
    AvatarComponent,
    SvgIconComponent,
  ],
})
export class SharedComponentsModule {}
