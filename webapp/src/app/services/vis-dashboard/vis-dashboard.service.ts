import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';


interface CourseCategory {
  entity: string;
  course_category: string;
}

interface CoursesByPopularity{
  CourseId: string;
  TeacherName:string;
  CourseName:string;
  NumberOfParticipants: number
}

interface CoursesByRating{
  CourseId: string;
  TeacherName:string;
  CourseName:string;
  Rating: number
}


export interface Course {
  CourseId: string;
  Audience: string;
  Goal: string;
  Keywords: string;
  Level: string;
  NumberOfParticipants: string;
  Link: string;
  Rating: string;
  Description: string;
  Language: string;
  Recommendations: string;
  Duration: string;
  Prerequisites: string;
  Content: string;
  Price: string;
  Name: string;
  Category: string;
}


@Injectable({
  providedIn: 'root'
})
export class VisDashboardService {

  constructor(public http:HttpClient) { }

  async getCourseCategories(): Promise<CourseCategory[]> {
    return lastValueFrom(this.http.get<CourseCategory[]>(
      `${environment.API_URL}/vis-dashboard/course-categories`
    ));
  }

  async getCoursesByPopularity(platform:string):Promise<CoursesByPopularity[]>{
    return lastValueFrom(this.http.get<CoursesByPopularity[]>(
      `${environment.API_URL}/vis-dashboard/popular-courses/${platform}`
    ));
  }

  async getCoursesByRating(platform:string):Promise<CoursesByRating[]>{
    return lastValueFrom(this.http.get<CoursesByRating[]>(
      `${environment.API_URL}/vis-dashboard/rating-courses/${platform}`
    ));
  }

  async getCourseById(id:string):Promise<Course[]>{
    return lastValueFrom(this.http.get<Course[]>(
      `${environment.API_URL}/vis-dashboard/course/${id}`
    ));
  }



}
