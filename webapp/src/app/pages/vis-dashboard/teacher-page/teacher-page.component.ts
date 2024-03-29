import { Component,OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {Teacher, VisDashboardService} from "../../../services/vis-dashboard/vis-dashboard.service";


@Component({
  selector: 'app-teacher-page',
  templateUrl: './teacher-page.component.html',
  styleUrls: ['./teacher-page.component.css']
})
export class TeacherPageComponent implements OnInit {
  emittedTeacherId: string;
  loadedData: Teacher[]=[]
  teacherName:Teacher={
    "TeacherName": "",
    "TeacherId": "",
    "CourseId": "",
    "CourseName": ""
  }


  constructor(private route: ActivatedRoute,private visDashboardService:VisDashboardService,
              private router:Router) {
  }

  ngOnInit(): void {
    this.emittedTeacherId = this.route.snapshot.paramMap.get('id');
    this.fetchTeacherData();

  }

  fetchTeacherData(){
    this.visDashboardService.getTeacherById(this.emittedTeacherId)
      .then((teacher)=> {
        this.loadedData = teacher
        this.teacherName = teacher.find(x => x.TeacherId === this.emittedTeacherId)
      })

  }


  onCourseClick(CourseId: string) {
    this.router.navigate(['course-detail', CourseId])

  }
}
