import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from 'src/app/modules/primeng/primeng.module';
import { AddMaterialComponent } from './add-material/add-material.component';
import { MaterialComponent } from './material/material.component';
import { AnnotationModule } from '../annotations/pdf-annotation/annotation.module';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store, StoreModule } from '@ngrx/store';
import { materialReducer } from './state/materials.reducer';
import { DashboardComponent } from './dashboard/dashboard.component';



@NgModule({
  declarations: [
    MaterialComponent,
    AddMaterialComponent,
    DashboardComponent
  ],
  imports: [
    CommonModule,
    PrimengModule,
    AnnotationModule,
    PdfViewerModule,
    FormsModule,
    ReactiveFormsModule,
    StoreModule.forFeature('material', materialReducer)
  ],
  exports: [
    MaterialComponent,
    AddMaterialComponent
  ]
})
export class MaterialsModule { }
