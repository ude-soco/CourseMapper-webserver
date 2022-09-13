import { environment } from './../../environments/environment';
import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { Topic } from '../models/Topic';
import { Channel } from '../models/Channel';
import { Course } from '../models/Course';

@Injectable({
  providedIn: 'root'
})
export class TopicChannelService {
  private API_URL = environment.API_URL;
  topics: Topic[] = [];
  onUpdateTopics$ = new Subject<Topic[]>();


  constructor(private http: HttpClient) {   }

  /** GET Topics of a course from the server */
  fetchTopics(course_id: string):  Observable<Topic[]> {
    return this.http.get<Topic[]>(`${this.API_URL}/courses/topics/${course_id}`).pipe(tap( topics => {      
      this.topics = topics         
    }));
  }

  updateTopics(course_id: string){
    this.fetchTopics(course_id).subscribe(topics => {
      this.topics = topics;
      this.onUpdateTopics$.next(this.topics);
    });
  }
}
