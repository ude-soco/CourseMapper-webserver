import { Injectable } from '@angular/core';
import { HttpClient, HttpParams  } from '@angular/common/http'; // new HttpParams 
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
  ConceptName: string;
  Count?: number; // new
}

export interface CourseByPlatformAndConcept{
  CourseId:string;
  CourseName:string;
  Rating: number;//new
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
  CourseId: string; //added this line
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
  CourseId: string; //added this line
  CourseName:string;
  CoursePrice: string;
  CourseRating: string
}

export interface ConceptsByCategories{
  ConceptName: string;
  PlatformName: string;
}

export interface TeacherCourseRow {
  Id?: number;                 
  CourseId?: string;
  CourseName: string;
  Rating: number;              //  coerce to a number (defaults to 0)
  NumberOfParticipants?: number;
  Language?: string;
  Level?: string;
  Platform?: string;
}

export interface CourseListRow {
  Id: number;
  CourseId: string;
  CourseName: string;
  Rating: number;                 // normalized number, 0 when missing
  NumberOfParticipants: number;   // normalized number, 0 when missing
  Language?: string;
  Level?: string;
  Platform?: string;
}

export interface Paginated<T> {
  total: number;
  items: T[];
}

export interface TeacherListItem {
  id: number | string;         // backend returns number id; keep string-compatible for safety
  name: string;
  courseCount: number;
}

export interface InstitutionListItem {
  id: number | string;
  name: string;
  courseCount: number;
}

export interface CourseLite {
  id: number | string;
  courseId?: string;
  title: string;
  platform: string;
  rating: number | null;
  enrolled: number;
}


@Injectable({
  providedIn: 'root'
})
export class VisDashboardService {

  private readonly BASE = `${environment.API_URL}/vis-dashboard`; // added this

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

  async getCoursesByCourseCategory(courseCategory:string, sortByPopularity:boolean):Promise<CourseByCategory[]>{
    return lastValueFrom(this.http.post<CourseByCategory[]>(
      `${environment.API_URL}/vis-dashboard/course-by-category/${courseCategory}`, {sortByPopularity: sortByPopularity}
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


  // Get concepts from a single platform: Fetch request
  /*async getConceptsByPlatform(platform:string):Promise<Concept[]>{
    return lastValueFrom(this.http.get<Concept[]>(
      `${environment.API_URL}/vis-dashboard/concept-by-platform/${platform}`
    ));
  }*/

  async getConceptsByPlatform(platform: string): Promise<Concept[]> {
    const url = `${environment.API_URL}/vis-dashboard/concept-by-platform/${encodeURIComponent(platform)}?v=${Date.now()}`;
    return lastValueFrom(this.http.get<Concept[]>(url));
  }

/*/ Get the courses by concepts and selected platform
  async getCoursesByConceptAndPlatform(platform:string,concept:string):Promise<CourseByPlatformAndConcept[]>{
    return lastValueFrom(this.http.get<CourseByPlatformAndConcept[]>(
      `${environment.API_URL}/vis-dashboard/courses-for-explore/${platform}/${concept}`
    ));
  }*/
 // Get the courses by concepts and selected platform
  async getCoursesByConceptAndPlatform(platform: string, concept: string) {
    const url =
      `${environment.API_URL}/vis-dashboard/courses-for-explore/` +
      `${encodeURIComponent(platform)}/` +
      `${encodeURIComponent(concept)}?v=${Date.now()}`;

    const rows = await lastValueFrom(this.http.get<CourseByPlatformAndConcept[]>(url));
    return (rows || []).map(r => ({ ...r, Rating: Number(r.Rating) }));
  }


  // Get courses by popularity for a platform: Fetch request
  async getCoursesByPopularityForVis(platform:string,datapointCount:number):Promise<CoursesByPopularityForVis[]>{
    return lastValueFrom(this.http.get<CoursesByPopularityForVis[]>(
      `${environment.API_URL}/vis-dashboard/courses-popular-explore/${platform}/${datapointCount}`
    ));
  }

  // Get most popular categories of courses: Fetch request
  async getCategoryByPopularityForVis(platform:string,datapointCount:number):Promise<CategoriesByPopularityForVis[]>{
    return lastValueFrom(this.http.get<CategoriesByPopularityForVis[]>(
      `${environment.API_URL}/vis-dashboard/category-popular-explore/${platform}/${datapointCount}`
    ));
  }


  // Get most active teachers by selected platform : Fetch request
  async getActiveTeachersForVis(platform:string,datapointCount:number):Promise<ActiveTeachers[]>{
    return lastValueFrom(this.http.get<ActiveTeachers[]>(
      `${environment.API_URL}/vis-dashboard/active-teachers/${platform}/${datapointCount}`
    ));
  }

  //  Get most active institutions in a platform : Fetch request
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

  // Get platforms by teacher count for compare : Fetch request
  async getPlatformsByTeacherCount(platforms:string[]):Promise<PlatformsByTeacherCount[]>{
    return lastValueFrom(this.http.post<PlatformsByTeacherCount[]>(
      `${environment.API_URL}/vis-dashboard/compare-platforms-teachers`,{platforms:platforms}
    ));
  }


  // Get platforms by number of institutions in compare: Fetch request
  async getPlatformsByInstitutionCount(platforms:string[]):Promise<PlatformsByInstitutionCount[]>{
    return lastValueFrom(this.http.post<PlatformsByInstitutionCount[]>(
      `${environment.API_URL}/vis-dashboard/compare-platforms-institutions`,{platforms:platforms}
    ));
  }


  // Get platforms by number of participants in compare: Fetch request
  async getPlatformsByParticipants(platforms:string[]):Promise<PlatformsByParticipants[]>{
    return lastValueFrom(this.http.post<PlatformsByParticipants[]>(
      `${environment.API_URL}/vis-dashboard/compare-platforms-participants`,{platforms:platforms}
    ));
  }


  //  Get course on concept selection : Fetch request
  async getCoursesByConceptForCompare(platforms:string[],concept:string):Promise<CourseConceptCompare[]>{
    return lastValueFrom(this.http.post<CourseConceptCompare[]>(
      `${environment.API_URL}/vis-dashboard/courses-concept-compare/${concept}`,{platforms:platforms}
    ));
  }



  // Get concepts by selected platforms : fetch request
  async getConceptsByPlatforms(platforms:string[]):Promise<Concept[]>{
    return lastValueFrom(this.http.post<Concept[]>(
      `${environment.API_URL}/vis-dashboard/courses-concept-platforms`,{platforms:platforms}
    ));
  }


  // Get courses by concept in Find : Fetch Request
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


  async getTopicsByCategory(courseCategory:string):Promise<ConceptsByCategories[]>{
    return lastValueFrom(this.http.get<ConceptsByCategories[]>(
      `${environment.API_URL}/vis-dashboard/concept-categories/${courseCategory}`
    ));
  }


  async addLangaugesToPlatforms():Promise<any>{
    return lastValueFrom(this.http.post<any>(
      `${environment.API_URL}/vis-dashboard/add-langauge-platform/`,{}
    ));
  }
  
  /*/ Courses for a teacher (by id) on a given platform — used by Explore page panel
  async getTeacherCoursesForVisById(platform: string, teacherId: number): Promise<any[]> {
    return lastValueFrom(this.http.get<any[]>(
      `${environment.API_URL}/vis-dashboard/teacher-courses/${teacherId}/${encodeURIComponent(platform)}`
   ));
  }

  // Same, by teacher name (fallback if the chart lacks ids)
  async getTeacherCoursesForVisByName(platform: string, teacherName: string): Promise<any[]> {
   return lastValueFrom(this.http.get<any[]>(
     `${environment.API_URL}/vis-dashboard/teacher-courses-by-name/${encodeURIComponent(teacherName)}/${encodeURIComponent(platform)}`
   ));
  }
  // Courses for a teacher (by id) on a given platform — used by Explore page panel
  async getTeacherCoursesForVisById(platform: string, teacherId: number): Promise<TeacherCourseRow[]> {
    const url = `${environment.API_URL}/vis-dashboard/teacher-courses/${teacherId}/${encodeURIComponent(platform)}`;
    const rows = await lastValueFrom(this.http.get<any[]>(url));
    // Coerce Rating to number; default to 0 when missing (keeps UI stable until backend is updated)
    return (rows || []).map(r => ({
      ...r,
      Rating: Number((r?.Rating ?? r?.rating ?? 0)) || 0,
    }));
  }

  // Same, by teacher name (fallback if the chart lacks ids)
  async getTeacherCoursesForVisByName(platform: string, teacherName: string): Promise<TeacherCourseRow[]> {
    const url = `${environment.API_URL}/vis-dashboard/teacher-courses-by-name/${encodeURIComponent(teacherName)}/${encodeURIComponent(platform)}`;
    const rows = await lastValueFrom(this.http.get<any[]>(url));
    return (rows || []).map(r => ({
      ...r,
      Rating: Number((r?.Rating ?? r?.rating ?? 0)) || 0,
    }));
  }


  // Courses for an institution (by id) on a given platform — used by Explore page panel
  async getInstitutionCoursesForVisById(platform: string, institutionId: number): Promise<any[]> {
    return lastValueFrom(this.http.get<any[]>(
      `${environment.API_URL}/vis-dashboard/institution-courses/${institutionId}/${encodeURIComponent(platform)}`
   ));
  }

  // Same, by institution name (fallback if the chart lacks ids)
  async getInstitutionCoursesForVisByName(platform: string, institutionName: string): Promise<any[]> {
    return lastValueFrom(this.http.get<any[]>(
      `${environment.API_URL}/vis-dashboard/institution-courses-by-name/${encodeURIComponent(institutionName)}/${encodeURIComponent(platform)}`
    ));
  }*/
 // Teacher by ID
async getTeacherCoursesForVisById(platform: string, teacherId: number): Promise<CourseListRow[]> {
  const url =
    `${environment.API_URL}/vis-dashboard/teacher-courses/${teacherId}/${encodeURIComponent(platform)}`;
  const rows = await lastValueFrom(this.http.get<CourseListRow[]>(url));
  return (rows || []).map(r => ({
    ...r,
    Rating: Number(r.Rating ?? 0) || 0,
    NumberOfParticipants: Number(String(r.NumberOfParticipants ?? '0').replace(/,/g, '')) || 0,
  }));
}

// Teacher by name
async getTeacherCoursesForVisByName(platform: string, teacherName: string): Promise<CourseListRow[]> {
  const url =
    `${environment.API_URL}/vis-dashboard/teacher-courses-by-name/${encodeURIComponent(teacherName)}/${encodeURIComponent(platform)}`;
  const rows = await lastValueFrom(this.http.get<CourseListRow[]>(url));
  return (rows || []).map(r => ({
    ...r,
    Rating: Number(r.Rating ?? 0) || 0,
    NumberOfParticipants: Number(String(r.NumberOfParticipants ?? '0').replace(/,/g, '')) || 0,
  }));
}

// Institution by ID
async getInstitutionCoursesForVisById(platform: string, institutionId: number): Promise<CourseListRow[]> {
  const url =
    `${environment.API_URL}/vis-dashboard/institution-courses/${institutionId}/${encodeURIComponent(platform)}`;
  const rows = await lastValueFrom(this.http.get<CourseListRow[]>(url));
  return (rows || []).map(r => ({
    ...r,
    Rating: Number(r.Rating ?? 0) || 0,
    NumberOfParticipants: Number(String(r.NumberOfParticipants ?? '0').replace(/,/g, '')) || 0,
  }));
}

// Institution by name
async getInstitutionCoursesForVisByName(platform: string, institutionName: string): Promise<CourseListRow[]> {
  const url =
    `${environment.API_URL}/vis-dashboard/institution-courses-by-name/${encodeURIComponent(institutionName)}/${encodeURIComponent(platform)}`;
  const rows = await lastValueFrom(this.http.get<CourseListRow[]>(url));
  return (rows || []).map(r => ({
    ...r,
    Rating: Number(r.Rating ?? 0) || 0,
    NumberOfParticipants: Number(String(r.NumberOfParticipants ?? '0').replace(/,/g, '')) || 0,
  }));
}
async getTeachersByPlatform(
  platform: string,
  page = 1,
  pageSize = 10,
  q = ''
): Promise<Paginated<TeacherListItem>> {
  const url =
    `${environment.API_URL}/vis-dashboard/platform-teachers/` +
    `${encodeURIComponent(platform)}?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`;
  return lastValueFrom(this.http.get<Paginated<TeacherListItem>>(url));
}

async getInstitutionsByPlatform(
  platform: string,
  page = 1,
  pageSize = 10,
  q = ''
): Promise<Paginated<InstitutionListItem>> {
  const url =
    `${environment.API_URL}/vis-dashboard/platform-institutions/` +
    `${encodeURIComponent(platform)}?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`;
  return lastValueFrom(this.http.get<Paginated<InstitutionListItem>>(url));
}

/** Compact list for all (or selected) platforms. */
 async getCoursesLite(selectedPlatforms: string[] = [], limit = 50): Promise<CourseLite[]> {
    let params = new HttpParams().set('limit', String(limit));
    if (selectedPlatforms.length) {
      params = params.set('platforms', selectedPlatforms.join(','));
    }
    const url = `${this.BASE}/courses-lite`;
    return lastValueFrom(this.http.get<CourseLite[]>(url, { params }));
  }

/** Compact list for a single platform (used after pie slice click). */
 async getCoursesLiteByPlatform(platform: string, limit = 50): Promise<CourseLite[]> {
    const params = new HttpParams().set('platform', platform).set('limit', String(limit));
    const url = `${this.BASE}/courses-lite`;
    return lastValueFrom(this.http.get<CourseLite[]>(url, { params }));
  }

// New: Paginated, filterable, sortable list of courses for pie chart in compare
async getPlatformCourses(opts: {
    platform?: string;
    platforms?: string[];
    page?: number;
    pageSize?: number;
    q?: string;
    sort?: 'enrolled' | 'rating' | 'name';
    order?: 'asc' | 'desc';
    minRating?: number;
  }): Promise<Paginated<CourseLite>> {
    let params = new HttpParams();
    if (opts.platform)  params = params.set('platform', opts.platform);
    if (opts.platforms?.length) params = params.set('platforms', opts.platforms.join(','));
    if (opts.page)      params = params.set('page', String(opts.page));
    if (opts.pageSize)  params = params.set('pageSize', String(opts.pageSize));
    if (opts.q)         params = params.set('q', opts.q);
    if (opts.sort)      params = params.set('sort', opts.sort);
    if (opts.order)     params = params.set('order', opts.order);
    if (opts.minRating !== undefined) params = params.set('minRating', String(opts.minRating));

    return lastValueFrom(this.http.get<Paginated<CourseLite>>(
      `${this.BASE}/platform-courses`, { params }
    ));
  }




}
