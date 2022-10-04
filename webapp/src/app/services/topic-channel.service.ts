import { TopicImp } from './../models/TopicImp';
import { environment } from './../../environments/environment';
import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, Subject, tap } from 'rxjs';
import { Topic } from '../models/Topic';
import { Channel } from '../models/Channel';
import { Course } from '../models/Course';

@Injectable({
  providedIn: 'root'
})
export class TopicChannelService {
  private API_URL = environment.API_URL;
  private topics: Topic[] = [];
  // the selectedTopic is used only to identify the Topic we add a channel to.
  private selectedTopic: Topic = new TopicImp('','','',[]);
  onUpdateTopics$ = new Subject<Topic[]>();


  constructor(private http: HttpClient) {   }

  /** GET Topics of a course from the server */
  fetchTopics(courseId: string):  Observable<Topic[]> {
    return this.http.get<Topic[]>(`${this.API_URL}/courses/${courseId}`).pipe(tap( topics => {
      this.topics = topics;     
    }));
  }

  updateTopics(courseId: string){
    this.fetchTopics(courseId).subscribe(topics => {
      this.topics = topics;
      this.onUpdateTopics$.next(this.topics);
    });
  }

  addTopic(topic: Topic, course: Course){   
    return this.http.post<any>(`${this.API_URL}/courses/${course._id}/topic`, {name: topic.name})
    .pipe(
      catchError(( errResponse, sourceObservable) => {
       if (errResponse.status ===  404) {
        return of({errorMsg: errResponse.error.error });
       }else {        
        return of({errorMsg: "Error in connection: Please reload the application" })
       }
    }),
      tap(res => {
        if ( !('errorMsg' in res) ){
          this.topics.push(res.savedTopic);
          this.onUpdateTopics$.next(this.topics);
        }
    }));
  }

  selectTopic(topic: Topic){
    this.selectedTopic = topic;
  }
  addChannel(channel: Channel){    
    // TODO send user inputs to backend and update the data in the service 
    this.topics.forEach(topic => {
      if (topic._id.toString() === channel.topicId.toString()) {
        topic.channels.push(channel);
      }
    })
    this.onUpdateTopics$.next(this.topics);
  }

  getSelectedTopic(): Topic{
    return this.selectedTopic;
  }
}
