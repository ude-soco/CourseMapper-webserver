import { Component,OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {Concept, VisDashboardService} from "../../../services/vis-dashboard/vis-dashboard.service";
import {Course} from "../../../services/vis-dashboard/vis-dashboard.service";

@Component({
  selector: 'app-course-details-page',
  templateUrl: './course-details-page.component.html',
  styleUrls: ['./course-details-page.component.css']
})
export class CourseDetailsPageComponent implements OnInit{

  courseId: string;
  course: Course[];
  concepts: Concept[]

  constructor(private route: ActivatedRoute,
              private visDashboardService: VisDashboardService) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('id');
    this.getCourseDetails()
    this.getCourseConcepts(this.courseId)
  }

  getCourseDetails(){
    this.visDashboardService.getCourseById(this.courseId).then((course)=>{
      this.course = course
    })
  }

 getCourseConcepts(courseId:string){
    this.visDashboardService.getConceptsByCourseId(courseId).then((concept)=>{
      this.concepts = concept
      console.log(this.concepts)
    })
  }



}
