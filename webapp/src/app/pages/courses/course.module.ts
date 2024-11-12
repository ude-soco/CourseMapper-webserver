import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { courseReducer } from './state/course.reducer';
import { CourseDescriptionComponent } from '../components/course-description/course-description.component';
import { AppModule } from '../../app.module';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { RouterModule } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PrimengModule } from 'src/app/modules/primeng/primeng.module';
import { ToastModule } from 'primeng/toast';
import { EffectsModule } from '@ngrx/effects';
import { CourseEffects } from './state/course.effects';
import { TagsPageComponent } from '../components/tags/tags-page/tags-page.component';
import { AnnotationModule } from '../components/annotations/annotation.module';
import { PdfCommentItemComponent } from '../components/annotations/pdf-annotation/pdf-comment-item/pdf-comment-item.component';
import { MemberTableComponent } from './components/member-table/member-table.component';
import { CourseDetailsComponent } from './course-details/course-details.component';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PermissionsComponent } from './components/permissions/permissions.component';
import { AccordionModule } from 'primeng/accordion';
import { RolesComponent } from './components/roles/roles.component';

@NgModule({
  declarations: [
    MemberTableComponent,
    CourseDetailsComponent,
    PermissionsComponent,
    RolesComponent
  ],
  exports: [],
  imports: [
    CommonModule,
    StoreModule.forFeature('course', courseReducer),
    EffectsModule.forFeature([CourseEffects]),
    ConfirmDialogModule,
    PrimengModule,
    ToastModule,
    TableModule,
    PrimengModule,
    AccordionModule,
    TagModule,
    ProgressSpinnerModule
  ],
})
export class CourseModule {}
