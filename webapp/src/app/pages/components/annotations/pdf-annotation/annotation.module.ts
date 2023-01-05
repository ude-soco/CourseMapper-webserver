import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from 'src/app/modules/primeng/primeng.module';
import { StoreModule } from '@ngrx/store';
import { PdfAnnotationToolbarComponent } from './pdf-annotation-toolbar/pdf-annotation-toolbar.component';
import { PdfCommentItemComponent } from './pdf-comment-item/pdf-comment-item.component';
import { PdfCommentPanelComponent } from './pdf-comment-panel/pdf-comment-panel.component';
import { PdfCreateAnnotationComponent } from './pdf-create-annotation/pdf-create-annotation.component';
import { PdfMainAnnotationComponent } from './pdf-main-annotation/pdf-main-annotation.component';
import { annotationReducer } from './state/annotation.reducer';
import { EffectsModule } from '@ngrx/effects';
import { AnnotationEffects } from './state/annotation.effects';



@NgModule({
  declarations: [
    PdfAnnotationToolbarComponent,
    PdfCreateAnnotationComponent,
    PdfCommentPanelComponent,
    PdfCommentItemComponent,
    PdfMainAnnotationComponent
  ],
  imports: [
    CommonModule,
    PrimengModule,
    StoreModule.forFeature('annotation', annotationReducer),
    EffectsModule.forFeature([AnnotationEffects])
  ],
  exports: [
    PdfAnnotationToolbarComponent,
    PdfCreateAnnotationComponent,
    PdfCommentPanelComponent,
    PdfCommentItemComponent,
    PdfMainAnnotationComponent
  ]
})
export class AnnotationModule { }
