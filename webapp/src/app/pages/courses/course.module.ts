import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { courseReducer } from './state/course.reducer';
import { CourseDescriptionComponent } from '../components/course-description/course-description.component';
import { AppModule } from "../../app.module";
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { RouterModule } from '@angular/router';










@NgModule({
    declarations: [
        
        
        
    ],
    exports: [
       
        
        
        
        
    ],
    imports: [
        CommonModule,
        StoreModule.forFeature('course', courseReducer),
        
        
    
        
        
        
        
        
    ]
})
export class CourseModule { }
