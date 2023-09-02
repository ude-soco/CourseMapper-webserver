import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from 'src/app/modules/primeng/primeng.module';
import { StoreModule } from '@ngrx/store';
import { PdfAnnotationToolbarComponent } from './pdf-annotation/pdf-annotation-toolbar/pdf-annotation-toolbar.component';
import { PdfCommentItemComponent } from './pdf-annotation/pdf-comment-item/pdf-comment-item.component';
import { PdfCommentPanelComponent } from './pdf-annotation/pdf-comment-panel/pdf-comment-panel.component';
import { PdfCreateAnnotationComponent } from './pdf-annotation/pdf-create-annotation/pdf-create-annotation.component';
import { PdfMainAnnotationComponent } from './pdf-annotation/pdf-main-annotation/pdf-main-annotation.component';
import { annotationReducer } from './pdf-annotation/state/annotation.reducer';
import { EffectsModule } from '@ngrx/effects';
import { AnnotationEffects } from './pdf-annotation/state/annotation.effects';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { PdfDrawboxComponent } from './pdf-annotation/pdf-drawbox/pdf-drawbox.component';
import { SharedComponentsModule } from 'src/app/components/shared-components.module';
import { PdfReplyItemComponent } from './pdf-annotation/pdf-reply-item/pdf-reply-item.component';
import { PdfReplyPanelComponent } from './pdf-annotation/pdf-reply-panel/pdf-reply-panel.component';
import { MenuModule } from 'primeng/menu';
import { PdfAnnotationSummaryComponent } from './pdf-annotation/pdf-annotation-summary/pdf-annotation-summary.component';
import { VideoMainAnnotationComponent } from './video-annotation/video-main-annotation/video-main-annotation.component';
import { videoReducer } from './video-annotation/state/video.reducer';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { RouterModule } from '@angular/router';
import { VideoAnnotationToolbarComponent } from './video-annotation/video-annotation-toolbar/video-annotation-toolbar.component';
import { VideoCreateAnnotationComponent } from './video-annotation/video-create-annotation/video-create-annotation.component';
import { VideoDrawingOverlayComponent } from './video-annotation/video-drawing-overlay/video-drawing-overlay.component';
import { VideoRenderingOverlayComponent } from './video-annotation/video-rendering-overlay/video-rendering-overlay.component';
import { VideoAnnotationSummaryComponent } from './video-annotation/video-annotation-summary/video-annotation-summary.component';
import { UpdateBorderColorDirective } from 'src/app/custom_directives/update-border-color.directive';
import { VideoEffects } from './video-annotation/state/video.effects';
import { TagsPageComponent } from '../tags/tags-page/tags-page.component';
import { NgsContenteditableModule } from '@ng-stack/contenteditable';
import { MentionsModule } from '@flxng/mentions';
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
    PdfAnnotationSummaryComponent,
    VideoMainAnnotationComponent,
    VideoAnnotationToolbarComponent,
    VideoCreateAnnotationComponent,
    VideoDrawingOverlayComponent,
    VideoRenderingOverlayComponent,
    VideoAnnotationSummaryComponent,
    UpdateBorderColorDirective,
  ],
  exports: [
    PdfAnnotationToolbarComponent,
    PdfCreateAnnotationComponent,
    PdfCommentPanelComponent,
    PdfCommentItemComponent,
    PdfMainAnnotationComponent,
    VideoMainAnnotationComponent,
    YouTubePlayerModule,
  ],
  imports: [
    MentionsModule,
    CommonModule,
    PrimengModule,
    PdfViewerModule,
    SharedComponentsModule,
    MenuModule,
    StoreModule.forFeature('annotation', annotationReducer),
    StoreModule.forFeature('video', videoReducer),
    EffectsModule.forFeature([AnnotationEffects]),
    EffectsModule.forFeature([VideoEffects]),
    YouTubePlayerModule,
    RouterModule.forChild([
      {
        path: ':materialId/pdf',
        component: PdfMainAnnotationComponent,
        outlet: 'material',
        pathMatch: 'full',
      },
      {
        path: ':materialId/video',
        component: VideoMainAnnotationComponent,
        outlet: 'material',
        pathMatch: 'full',
      },
    ]),
  ],
})
export class AnnotationModule {}
