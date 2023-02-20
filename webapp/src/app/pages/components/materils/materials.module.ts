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



@NgModule({
  declarations: [
    MaterialComponent,
    AddMaterialComponent
  ],
  imports: [
    CommonModule,
    PrimengModule,
    AnnotationModule,
    PdfViewerModule,
    FormsModule,
    ReactiveFormsModule,
    SharedComponentsModule,
    StoreModule.forFeature('material', materialReducer)
  ],
  exports: [
    MaterialComponent,
    AddMaterialComponent
  ]
})
export class MaterialsModule { }
