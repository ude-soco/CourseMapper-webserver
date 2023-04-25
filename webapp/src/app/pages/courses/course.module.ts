import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { courseReducer } from './state/course.reducer';
import { CourseDescriptionComponent } from '../components/course-description/course-description.component';
import { AppModule } from "../../app.module";
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { RouterModule } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PrimengModule } from 'src/app/modules/primeng/primeng.module';
import { ToastModule } from 'primeng/toast';
import { EffectsModule } from '@ngrx/effects';
import { CourseEffects } from './state/course.effects';
import { TagsPageComponent } from './tags-page/tags-page.component';










@NgModule({
    declarations: [
        
        
        
    
    TagsPageComponent
  ],
    exports: [
       
        
        
        
        
    ],
    imports: [
        CommonModule,
        StoreModule.forFeature('course', courseReducer),
        EffectsModule.forFeature([CourseEffects]),
        ConfirmDialogModule,
        PrimengModule,
        ToastModule
        
        
    
        
        
        
        
        
    ]
})
export class CourseModule { }
