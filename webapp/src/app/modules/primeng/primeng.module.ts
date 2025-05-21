import { NgModule } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import {TabViewModule} from 'primeng/tabview';
import {ToolbarModule} from 'primeng/toolbar';
import {ToggleButtonModule} from 'primeng/togglebutton';
import {MenubarModule} from 'primeng/menubar';
import {FileUploadModule} from 'primeng/fileupload';
import {InputTextareaModule} from 'primeng/inputtextarea';
import {PaginatorModule} from 'primeng/paginator';
import {PanelModule} from 'primeng/panel';
import {DropdownModule} from 'primeng/dropdown';
import {MultiSelectModule} from 'primeng/multiselect';
import {DividerModule} from 'primeng/divider';
import {ScrollerModule} from 'primeng/scroller';
import {DialogModule} from 'primeng/dialog';
import {EditorModule} from 'primeng/editor';
import {SliderModule} from 'primeng/slider';
import {CardModule} from 'primeng/card';
import {TooltipModule} from 'primeng/tooltip';
import {CheckboxModule} from 'primeng/checkbox';
import {ColorPickerModule} from 'primeng/colorpicker';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ToastModule} from 'primeng/toast';
import {MessageService} from 'primeng/api';
import {OverlayPanelModule} from 'primeng/overlaypanel';
import { MenuModule } from 'primeng/menu';


const PrimeNgComponents = [
  AvatarModule,
  AvatarGroupModule,
  InputTextModule,
  ButtonModule,
  PasswordModule,
  TabViewModule,
  ToolbarModule,
  ToggleButtonModule,
  MenubarModule,
  FileUploadModule,
  InputTextareaModule,
  PaginatorModule,
  PanelModule,
  DropdownModule,
  MultiSelectModule,
  DividerModule,
  ScrollerModule,
  DialogModule,
  EditorModule,
  SliderModule,
  CardModule,
  TooltipModule,
  CheckboxModule,
  ColorPickerModule,
  ConfirmDialogModule,
  ToastModule,
  OverlayPanelModule,
  MenuModule,

  
];

@NgModule({
  imports: [PrimeNgComponents],
  exports: [PrimeNgComponents],
  providers: [MessageService, ],
})
export class PrimengModule {}
