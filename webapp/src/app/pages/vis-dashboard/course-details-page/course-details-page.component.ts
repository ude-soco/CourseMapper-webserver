import { Component,OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {VisDashboardService} from "../../../services/vis-dashboard/vis-dashboard.service";
import {Course} from "../../../services/vis-dashboard/vis-dashboard.service";
@Component({
  selector: 'app-course-details-page',
  templateUrl: './course-details-page.component.html',
  styleUrls: ['./course-details-page.component.css']
})
export class CourseDetailsPageComponent implements OnInit{

  courseId: string;
  course: Course[];
  singleCourse: Course

  constructor(private route: ActivatedRoute, private visDashboardService: VisDashboardService) {


  }

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('id');

    this.getCourseDetails()


  }

  getCourseDetails(){
    this.visDashboardService.getCourseById(this.courseId).then((course)=>{
      this.course = course


    })
  }

}
