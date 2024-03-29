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
  PlatformName:string
}

export interface CourseByCategory {
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
  Price: string | number;
  Name: string;
  Category: string;
  PlatformName:string
  PlatformId: string
  TeacherName: string

}

export interface Concept{
  ConceptName: string
}

export interface TeacherByPopularity{
  TeacherName:string,
  TeacherId: string,
  TotalEnrollment:number,
  NumOfCourses: number
}

export interface Teacher{
  TeacherName:string,
  TeacherId: string,
  CourseId: string,
  CourseName: string
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

  async getConceptsByCourseId(courseId:string):Promise<Concept[]>{
    return lastValueFrom(this.http.get<Concept[]>(
      `${environment.API_URL}/vis-dashboard/concepts/${courseId}`
    ));
  }

  async getCoursesByCourseCategory(courseCategory:string):Promise<CourseByCategory[]>{
    return lastValueFrom(this.http.get<CourseByCategory[]>(
      `${environment.API_URL}/vis-dashboard/course-by-category/${courseCategory}`
    ));
  }


  async getPopularTeachers(platformName:string):Promise<TeacherByPopularity[]>{
    return lastValueFrom(this.http.get<TeacherByPopularity[]>(
      `${environment.API_URL}/vis-dashboard/teachers-by-popularity/${platformName}`
    ));
  }

  async getTeacherById(teacherId:string):Promise<Teacher[]>{
    return lastValueFrom(this.http.get<Teacher[]>(
      `${environment.API_URL}/vis-dashboard/teacher/${teacherId}`
    ));
  }




}
