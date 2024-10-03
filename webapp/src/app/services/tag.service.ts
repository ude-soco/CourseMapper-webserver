import { Injectable } from '@angular/core';
import { catchError, Observable, of, Subject, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Channel } from '../models/Channel';
import { Tag } from '../models/Tag';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Topic } from '../models/Topic';
import { Material } from '../models/Material';
import { Course } from '../models/Course';
import { Annotation } from '../models/Annotations';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class TagService {
 

  constructor(private http: HttpClient,  public storageService: StorageService,) {}
  

  getAllTagsForCurrentCourse(course: Course): Observable<Tag[]> {
   if(this.storageService.isLoggedIn() === false){
      return of([]);
   }
    return this.http
      .get<Tag[]>(`${environment.API_URL}/courses/${course._id}/tags`)
      .pipe(
        tap((tags) => {}),
        catchError((error: HttpErrorResponse) => {

          if (error.status === 401) {
            // console.warn("User is not authenticated. Token expired or not provided.");
            return of([]); // Return empty array so app continues
          }
          return throwError(error); // Rethrow other errors
        })
      );
  }

  getAllTagsForCurrentTopic(topic: Topic): Observable<Tag[]> {
    return this.http.get<Tag[]>(
      `${environment.API_URL}/courses/${topic.courseId}/topics/${topic._id}/tags`
    );
  }

  getAllTagsForCurrentChannel(channel: Channel): Observable<Tag[]> {
    return this.http.get<Tag[]>(
      `${environment.API_URL}/courses/${channel.courseId}/channels/${channel._id}/tags`
    );
  }

  getAllTagsForCurrentMaterial(material: Material): Observable<Tag[]> {
    return this.http.get<Tag[]>(
      `${environment.API_URL}/courses/${material.courseId}/materials/${material._id}/tags`
    );
  }

  getAllAnnotationsForTag(
    courseId: string,
    tagName: string
  ): Observable<Annotation[]> {
    return this.http.get<Annotation[]>(
      `${environment.API_URL}/courses/${courseId}/tag/${encodeURIComponent(
        tagName
      )}/get-all-annotation-for-tag`
    );
  }
}
