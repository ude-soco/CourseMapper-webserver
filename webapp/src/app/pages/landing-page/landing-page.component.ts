import { Component } from '@angular/core';
import { Course } from 'src/app/models/Course';
import { CourseService } from 'src/app/services/course.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {
  ids: Array<number>= [1,2,3]; ;
  courses: Array<Course> ;
  value1=""
  updatedCourses: any;
  constructor( private courseService: CourseService){}
  
  ngOnInit(){
    this.getAllCourses();
  }
  
  getAllCourses() {

    
    this.courseService.GetAllCourses()
      .subscribe({next:
         (courses) => {this.courses = courses;
      console.log("all courses from landing page")
      console.log(this.courses)
         }
    });
       
  }
  Search(){
    
 this.updatedCourses = this.courses.find(obj => obj.name === this.value1);
  //updatedCourses=coursesList
    
    console.log(this.updatedCourses);
    
    
  }
}