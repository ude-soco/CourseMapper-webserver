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
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { PdfDrawboxComponent } from './pdf-drawbox/pdf-drawbox.component';
import { SharedComponentsModule } from 'src/app/components/shared-components.module';
import { PdfReplyItemComponent } from './pdf-reply-item/pdf-reply-item.component';
import { PdfReplyPanelComponent } from './pdf-reply-panel/pdf-reply-panel.component';



@NgModule({
    declarations: [
        PdfAnnotationToolbarComponent,
        PdfCreateAnnotationComponent,
        PdfCommentPanelComponent,
        PdfCommentItemComponent,
        PdfMainAnnotationComponent,
        PdfDrawboxComponent,
        PdfReplyItemComponent,
        PdfReplyPanelComponent,
    ],
    exports: [
        PdfAnnotationToolbarComponent,
        PdfCreateAnnotationComponent,
        PdfCommentPanelComponent,
        PdfCommentItemComponent,
        PdfMainAnnotationComponent
    ],
    imports: [
        CommonModule,
        PrimengModule,
        PdfViewerModule,
        SharedComponentsModule,
        StoreModule.forFeature('annotation', annotationReducer),
        EffectsModule.forFeature([AnnotationEffects]),
    ]
})
export class AnnotationModule { }
