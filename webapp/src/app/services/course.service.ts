import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Annotation } from 'src/assets/data/Annotation';
import {
  Course,
  CreateChannel,
  CreateCourse,
  CreateLesson,
  CreateMaterial,
} from 'src/assets/data/Course';
// import {
//   Course,
//   CreateChannel,
//   CreateCourse,
//   CreateLesson,
//   CreateMaterial,
// } from 'src/assets/data/Course';
import { TagAnnotations } from 'src/assets/data/Tag';
import { backendEndpointURL } from '../api';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  constructor(
    private http: HttpClient,
    private authenticatioNService: AuthenticationService
  ) {}

  courses: Course[] = [];
  async getAllCourses(): Promise<Course[]> {
    this.http
      .get(`${backendEndpointURL}courses`, {
        headers: this.authenticatioNService.getHTTPHeaders(),
      })
      .subscribe((course) => {
        this.courses.push(course);
      });
    return this.courses;
  }

  async getCourseByID(id: string): Promise<Course | null> {
    // @ts-ignore
    return this.http
      .get<Course>(`${backendEndpointURL}courses/${id}`, {
        headers: this.authenticatioNService.getHTTPHeaders(),
      })
      .toPromise();
  }

  async getTagsForCourse(id: string): Promise<string[]> {
    // @ts-ignore
    return this.http
      .get<string[]>(`${backendEndpointURL}courses/${id}/tags`, {
        headers: this.authenticatioNService.getHTTPHeaders(),
      })
      .toPromise();
  }

  async getTagsForLesson(
    courseID: string,
    lessonID: string
  ): Promise<string[]> {
    // @ts-ignore
    return this.http
      .get<string[]>(
        `${backendEndpointURL}courses/${courseID}/${lessonID}/tags`,
        { headers: this.authenticatioNService.getHTTPHeaders() }
      )
      .toPromise();
  }

  async getTagsForChannel(
    courseID: string,
    channelID: string
  ): Promise<string[]> {
    // @ts-ignore
    return this.http
      .get<string[]>(
        `${backendEndpointURL}courses/${courseID}/channel/${channelID}/tags`,
        { headers: this.authenticatioNService.getHTTPHeaders() }
      )
      .toPromise();
  }

  async getAnnotationsWithTag(
    courseID: string,
    lessonID: string | undefined,
    channelID: string | undefined,
    tag: string
  ): Promise<TagAnnotations> {
    // TODO url encode tag
    if (channelID && lessonID) {
      // @ts-ignore
      return this.http
        .get<TagAnnotations>(
          `${backendEndpointURL}courses/${courseID}/${lessonID}/${channelID}/tags/${tag}/annotations`,
          { headers: this.authenticatioNService.getHTTPHeaders() }
        )
        .toPromise();
    }

    if (lessonID) {
      // @ts-ignore
      return this.http
        .get<TagAnnotations>(
          `${backendEndpointURL}courses/${courseID}/${lessonID}/tags/${tag}/annotations`,
          { headers: this.authenticatioNService.getHTTPHeaders() }
        )
        .toPromise();
    }
    // @ts-ignore
    return this.http
      .get<TagAnnotations>(
        `${backendEndpointURL}courses/${courseID}/tags/${tag}/annotations`,
        { headers: this.authenticatioNService.getHTTPHeaders() }
      )
      .toPromise();
  }
  async addCourse(course: CreateCourse): Promise<any> {
    return this.http
      .post<any>(`${backendEndpointURL}new/course`, course, {
        headers: this.authenticatioNService.getHTTPHeaders(),
      })
      .toPromise();
  }
  addChannel(channel: CreateChannel): Promise<any> {
    return this.http
      .post<any>(`${backendEndpointURL}new/channel`, channel, {
        headers: this.authenticatioNService.getHTTPHeaders(),
      })
      .toPromise();
  }
  addNewTopic(lesson: CreateLesson): Promise<any> {
    return this.http
      .post<any>(`${backendEndpointURL}new/topic`, lesson, {
        headers: this.authenticatioNService.getHTTPHeaders(),
      })
      .toPromise();
  }
  addTopicToCourse(topic: any): Promise<any> {
    return this.http
      .post<any>(`${backendEndpointURL}new/topic/course`, topic, {
        headers: this.authenticatioNService.getHTTPHeaders(),
      })
      .toPromise();
  }
  addMaterialToChannel(material: CreateMaterial): Promise<any> {
    return this.http
      .post<any>(`${backendEndpointURL}new/material`, material, {
        headers: this.authenticatioNService.getHTTPHeaders(),
      })
      .toPromise();
  }
  uploadFile(formData: any, materialType: string = 'lecture'): Observable<any> {
    if (materialType == 'video') {
      return this.http.post<any>(`${backendEndpointURL}uploadvideo`, formData, {
        headers: this.authenticatioNService.getHTTPHeaders(),
      });
    }

    return this.http.post<any>(`${backendEndpointURL}uploadfile`, formData, {
      headers: this.authenticatioNService.getHTTPHeaders(),
    });
  }
}
