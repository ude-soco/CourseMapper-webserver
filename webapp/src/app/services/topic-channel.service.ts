import { TopicImp } from './../models/TopicImp';
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
  private topics: Topic[] = [];
  // the selectedTopic is used only to identify the Topic we add a channel to.
  private selectedTopic: Topic = new TopicImp('','','',[]);
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

  addTopic(topic: Topic, course: Course){
    // TODO send user inputs to backend and update the data in the service     
    this.topics.push(topic);
    this.onUpdateTopics$.next(this.topics);
  }

  selectTopic(topic: Topic){
    this.selectedTopic = topic;
  }
  addChannel(channel: Channel){
    // TODO send user inputs to backend and update the data in the service 
    this.topics.forEach(topic => {
      if (topic._id.toString() === channel.topic_id.toString()) {
        topic.channels.push(channel);
      }
    })
    this.onUpdateTopics$.next(this.topics);
  }

  getSelectedTopic(): Topic{
    return this.selectedTopic;
  }
}
