import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from 'src/app/modules/primeng/primeng.module';
import { AddMaterialComponent } from './add-material/add-material.component';
import { MaterialComponent } from './material/material.component';
import { AnnotationModule } from '../annotations/annotation.module';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store, StoreModule } from '@ngrx/store';
import { materialReducer } from './state/materials.reducer';
import { SharedComponentsModule } from 'src/app/components/shared-components.module';
import { RouterModule } from '@angular/router';
import { PdfMainAnnotationComponent } from '../annotations/pdf-annotation/pdf-main-annotation/pdf-main-annotation.component';
import { ToastModule } from 'primeng/toast';
import { MenuModule } from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MaterialEffects } from './state/material.effects';
import { EffectsModule } from '@ngrx/effects';

@NgModule({
  declarations: [MaterialComponent, AddMaterialComponent],
  imports: [
    CommonModule,
    PrimengModule,
    PdfViewerModule,
    FormsModule,
    ToastModule,
    ReactiveFormsModule,
    SharedComponentsModule,
    MenuModule,
    ConfirmDialogModule,
    StoreModule.forFeature('material', materialReducer),
    EffectsModule.forFeature([MaterialEffects]),
    RouterModule.forChild([
      {
        path: '',
        component: MaterialComponent,
        children: [
          {
            path: ':materialId',
            loadChildren: () =>
              import('../annotations/annotation.module').then(
                (m) => m.AnnotationModule
              ),
          },
        ],
      },
    ]),
  ],
  exports: [MaterialComponent, AddMaterialComponent],
})
export class MaterialsModule {}
