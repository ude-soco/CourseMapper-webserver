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
  Rating?: string;
  Description: string;
  Language: string;
  Recommendations: string;
  Duration: string;
  Prerequisites: string;
  Content: string;
  Price: string ;
  Name: string;
  Category: string;
  PlatformName:string
  PlatformId: string
  TeacherName: string
}

export interface Concept{
  ConceptName: string
}

export interface CourseByPlatformAndConcept{
  CourseId:string,
  CourseName:string
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


export interface CoursesByPopularityForVis{
  CourseName:string;
  NumberOfParticipants: number
}

export interface CategoriesByPopularityForVis{
  CourseCategory:string;
  TotalParticipants: number
}

export interface ActiveTeachers{
  TeacherName: string,
  NumberOfCourses: number,
}


export interface ActiveInstitutions{
  InstitutionName: string,
  NumberOfCourses: number,
}

export interface PlatformsByTeacherCount{
  TeacherCount:number,
  PlatformName: string
}

export interface PlatformsByInstitutionCount{
  InstitutionCount:number,
  PlatformName: string
}



export interface PlatformsByParticipants{
  PlatformName: string,
  TotalParticipants: number
}

export interface CourseConceptCompare{
  CourseId:string,
  CourseName: string,
  PlatformName:string
}

export interface Platform{
  PlatformName:string,
  PlatformId: string,
  PlatformLanguage: string
}

export interface CoursesRatingsPricesForVis{
  CourseName:string;
  CoursePrice: string;
  CourseRating: string
}


@Injectable({
  providedIn: 'root'
})
export class VisDashboardService {

  constructor(public http:HttpClient) { }

  async getPlatforms(): Promise<Platform[]> {
    return lastValueFrom(this.http.get<Platform[]>(
      `${environment.API_URL}/vis-dashboard/platforms`
    ));
  }

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

  async getConceptsByPlatform(platform:string):Promise<Concept[]>{
    return lastValueFrom(this.http.get<Concept[]>(
      `${environment.API_URL}/vis-dashboard/concept-by-platform/${platform}`
    ));
  }

  async getCoursesByConceptAndPlatform(platform:string,concept:string):Promise<CourseByPlatformAndConcept[]>{
    return lastValueFrom(this.http.get<CourseByPlatformAndConcept[]>(
      `${environment.API_URL}/vis-dashboard/courses-for-explore/${platform}/${concept}`
    ));
  }

  async getCoursesByPopularityForVis(platform:string,datapointCount:number):Promise<CoursesByPopularityForVis[]>{
    return lastValueFrom(this.http.get<CoursesByPopularityForVis[]>(
      `${environment.API_URL}/vis-dashboard/courses-popular-explore/${platform}/${datapointCount}`
    ));
  }

  async getCategoryByPopularityForVis(platform:string,datapointCount:number):Promise<CategoriesByPopularityForVis[]>{
    return lastValueFrom(this.http.get<CategoriesByPopularityForVis[]>(
      `${environment.API_URL}/vis-dashboard/category-popular-explore/${platform}/${datapointCount}`
    ));
  }

  async getActiveTeachersForVis(platform:string,datapointCount:number):Promise<ActiveTeachers[]>{
    return lastValueFrom(this.http.get<ActiveTeachers[]>(
      `${environment.API_URL}/vis-dashboard/active-teachers/${platform}/${datapointCount}`
    ));
  }


  async getActiveInstitutionsForVis(platform:string,datapointCount:number):Promise<ActiveInstitutions[]>{
    return lastValueFrom(this.http.get<ActiveInstitutions[]>(
      `${environment.API_URL}/vis-dashboard/active-institutions/${platform}/${datapointCount}`
    ));
  }


  async PostTest(platform:string,datapointCount:number,{}):Promise<[]>{
    return lastValueFrom(this.http.post<[]>(
      `${environment.API_URL}/vis-dashboard/compare-platforms/${platform}/${datapointCount}`,{}
    ));
  }

  async getPlatformsByTeacherCount(platforms:string[]):Promise<PlatformsByTeacherCount[]>{
    return lastValueFrom(this.http.post<PlatformsByTeacherCount[]>(
      `${environment.API_URL}/vis-dashboard/compare-platforms-teachers`,{platforms:platforms}
    ));
  }


  async getPlatformsByInstitutionCount(platforms:string[]):Promise<PlatformsByInstitutionCount[]>{
    return lastValueFrom(this.http.post<PlatformsByInstitutionCount[]>(
      `${environment.API_URL}/vis-dashboard/compare-platforms-institutions`,{platforms:platforms}
    ));
  }

  async getPlatformsByParticipants(platforms:string[]):Promise<PlatformsByParticipants[]>{
    return lastValueFrom(this.http.post<PlatformsByParticipants[]>(
      `${environment.API_URL}/vis-dashboard/compare-platforms-participants`,{platforms:platforms}
    ));
  }

  async getCoursesByConceptForCompare(platforms:string[],concept:string):Promise<CourseConceptCompare[]>{
    return lastValueFrom(this.http.post<CourseConceptCompare[]>(
      `${environment.API_URL}/vis-dashboard/courses-concept-compare/${concept}`,{platforms:platforms}
    ));
  }


  async getConceptsByPlatforms(platforms:string[]):Promise<Concept[]>{
    return lastValueFrom(this.http.post<Concept[]>(
      `${environment.API_URL}/vis-dashboard/courses-concept-platforms`,{platforms:platforms}
    ));
  }

  async getCoursesByConceptFind(concept:string):Promise<CourseByCategory[]>{
    return lastValueFrom(this.http.post<CourseByCategory[]>(
      `${environment.API_URL}/vis-dashboard/courses-concept-find`,{concept:concept}
    ));
  }


  async getCoursesRatingsPricesForVis(platform:string,datapointCount:number):Promise<CoursesRatingsPricesForVis[]>{
    return lastValueFrom(this.http.get<CoursesRatingsPricesForVis[]>(
      `${environment.API_URL}/vis-dashboard/courses-ratings-prices/${platform}/${datapointCount}`
    ));
  }





}
