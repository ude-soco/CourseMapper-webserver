import { TopicImp } from '../models/TopicImp';
import { environment } from '../../environments/environment';
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
    return this.http.post<any>(`${this.API_URL}/courses/${course._id}/topic`, topic)
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
          this.sendTopicToOldBackend(res.savedTopic,course._id)
          this.onUpdateTopics$.next(this.topics);
        }
    }));
  }

  deleteTopic(topicTD: Topic){
    let index = this.topics.findIndex((topic) => {
      return topic._id === topicTD._id
    });
    return this.http.delete(`${this.API_URL}/courses/${topicTD.courseId}/topics/${topicTD._id}`,)
    .pipe(
      catchError(( err, sourceObservable) => {
        return of({errorMsg: err.error.error });
      }),
      tap(res =>{
        if(!('errorMsg' in res)){
          if (index !== -1) {
            this.topics.splice(index, 1);
            this.onUpdateTopics$.next(this.topics);
          }
        }
      })
    )
  }
  
  renameTopic(topicTD: Topic, newName:any){
    return this.http.put<any>(`${this.API_URL}/courses/${topicTD.courseId}/topics/${topicTD._id}`,newName)
    .pipe(
      catchError(( err, sourceObservable) => {
        return of({errorMsg: err.error.error });
      }),
    )
  }

  selectTopic(topic: Topic){
    this.selectedTopic = topic;
  }
  addChannel(channel: Channel, topic: Topic){    
    // TODO send user inputs to backend and update the data in the service 
    

    return this.http.post<any>(`${this.API_URL}/courses/${topic.courseId}/topics/${topic._id}/channel`, channel)
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
          this.topics.forEach(topic => {
            if (topic._id.toString() === res.savedChannel.topicId.toString()) {
              topic.channels.push(res.savedChannel);
            }
          })
          this.sendChannelToOldBackend(res.savedChannel)
          this.onUpdateTopics$.next(this.topics);
        }
    }));
  }

  deleteChannel(channelTD: Channel){
    let index=this.topics.map((topic)=>
      topic.channels.findIndex((channel)=>{
        return channel._id === channelTD._id
      })
    )
    return this.http.delete(`${this.API_URL}/courses/${channelTD.courseId}/channels/${channelTD._id}`,)
    .pipe(
      catchError(( err, sourceObservable) => {
        return of({errorMsg: err.error.error });
      }),
    )
  }
  
  renameChannel(channelTD: Channel, chId:string, newName: any){
    return this.http.put<any>(`${this.API_URL}/courses/${channelTD.courseId}/channels/${chId}`,newName)
    .pipe(
      catchError(( err, sourceObservable) => {
        return of({errorMsg: err.error.error });
      }),
    )
  }

  getSelectedTopic(): Topic{
    return this.selectedTopic;
  }

  sendTopicToOldBackend(topic, courseId){
    // userId should be taken from the coockies. for the time being it is hard coded
    this.http.post<any>('http://localhost:8090/new/topic', 
    {_id: topic._id, topic: topic.name, courseID:courseId, userID: '633d5bc0f15907e2f211b1ea',})
    .subscribe(
      
    );
  }

  sendChannelToOldBackend(channel){
    // userId should be taken from the coockies. for the time being it is hard coded
    this.http.post<any>('http://localhost:8090/new/channel', 
    {_id: channel._id, courseID: channel.courseId, topicID: channel.topicId, 
      name: channel.name, description:channel.description, 
      userID: '633d5bc0f15907e2f211b1ea',})
    .subscribe(
      
    );
  }

}
