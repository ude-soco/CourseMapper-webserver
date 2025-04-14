import { TopicImp } from '../models/TopicImp';
import { environment } from '../../environments/environment';
import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, Subject, tap } from 'rxjs';
import { Topic } from '../models/Topic';
import { Channel } from '../models/Channel';
import { Course } from '../models/Course';
import { StorageService } from './storage.service';
import { BlockingNotifications } from '../models/BlockingNotification';
import { Store } from '@ngrx/store';
import { State } from '../pages/courses/state/course.reducer';
import * as CourseActions from '../pages/courses/state/course.actions';

@Injectable({
  providedIn: 'root',
})
export class TopicChannelService {
  private API_URL = environment.API_URL;
  private topics: Topic[] = [];
  // the selectedTopic is used only to identify the Topic we add a channel to.
  private selectedTopic: Topic = new TopicImp('', '', '', []);
  onUpdateTopics$ = new Subject<Topic[]>();
  private user = this.storageService.getUser();
  onSelectChannel = new EventEmitter<Channel>();
  private selectedChannel: Channel;
  private channels: Channel[] = [];

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private store: Store<State>
  ) {}

  /**
   * @function fetchTopics
   * GET Topics of a course from the server
   *
   * @param {string} courseId the id of a course, the topics belongs to
   *
   */
  fetchTopics(courseId: string): Observable<{
    course: Course;
    notificationSettings: BlockingNotifications;
  }> {
    return this.http
      .get<{ course: Course; notificationSettings: BlockingNotifications }>(
        `${this.API_URL}/courses/${courseId}`
      )
      .pipe(
        tap((res) => {
          this.topics = res.course?.topics;
        })
      );
  }

  /**
   * @function updateTopics
   * Updates the topics data model in the frontend
   *
   * @param {string} courseId the id of a course, the topics belongs to
   *
   */
  updateTopics(courseId: string) {
    this.fetchTopics(courseId).subscribe((res) => {
      this.topics = res.course.topics;
      this.onUpdateTopics$.next(this.topics);
    });
  }

  logTopic(courseId: string, topicId: string): Observable<any> {
    return this.http.get<Course>(
      `${this.API_URL}/courses/${courseId}/topics/${topicId}`
    );
  }
  /**
   * @function addTopic
   * Add new topic to a course in the backend and if the communication was
   * successfull it adds the the topic to the data model in the frontend
   *
   * @param {Topic} topic the topic to be added
   * @param {Course} course the course, the topic will be added to
   *
   */
  addTopic(topic: Topic, course: Course) {
    return this.http
      .post<any>(`${this.API_URL}/courses/${course._id}/topic`, topic)
      .pipe(
        catchError((errResponse, sourceObservable) => {
          if (errResponse.status === 404) {
            return of({ errorMsg: errResponse.error.error });
          } else {
            return of({
              errorMsg: 'Error in connection: Please reload the application',
            });
          }
        }),
        tap((res) => {
          if (!('errorMsg' in res)) {
            this.topics.push(res.savedTopic);
            this.store.dispatch(
              CourseActions.setTopicNotificationSettingsSuccess({
                updatedDoc: res.updatedNotificationSettings,
              })
            );
            this.onUpdateTopics$.next(this.topics);
          }
        })
      );
  }

  /**
   * @function deleteTopic
   * Delete a topic in the backend
   *
   * @param {Topic} topicTD the topic to be deleted
   *
   */
  deleteTopic(topicTD: Topic) {
    return this.http
      .delete(
        `${this.API_URL}/courses/${topicTD.courseId}/topics/${topicTD._id}`
      )
      .pipe(
        catchError((errResponse, sourceObservable) => {
          if (errResponse.status === 404) {
            return of({ errorMsg: errResponse.error.error });
          } else {
            return of({
              errorMsg: 'Error in connection: Please reload the application',
            });
          }
        }),
        tap((res) => {
          if (!('errorMsg' in res)) {
            this.removeTopic(topicTD);
          }
        })
      );
  }

  /**
   * @function removeTopic
   * Delete a topic from the frontend data model
   *
   * @param {Topic} topicTD the channel to be deleted
   *
   */
  removeTopic(topicTD: Topic) {
    let index = this.topics.findIndex((topic) => {
      return topic._id === topicTD._id;
    });
    if (index !== -1) {
      this.topics.splice(index, 1);
      this.onUpdateTopics$.next(this.topics);
    }
  }

  renameTopic(topicTD: Topic, body: any) {
    return this.http
      .put<any>(
        `${this.API_URL}/courses/${topicTD.courseId}/topics/${topicTD._id}`,
        body
      )
      .pipe(
        catchError((err, sourceObservable) => {
          return of({ errorMsg: err.error.error });
        })
      );
  }

  /**
   * @function selectTopic
   * set selected topic
   *
   * @param {Topic} topic the topic to be selected
   *
   */
  selectTopic(topic: Topic) {
    this.selectedTopic = topic;
  }

  /**
   * @function addChannel
   * Add new Channel to a topic in the backend and if the communication was
   * successfull it adds the the channel to the same topic in the frontend
   *
   * @param {Channel} channel the channel to be added
   * @param {Topic} topic the topic, the channel will be added to
   *
   */
  addChannel(channel: Channel, topic: Topic) {
    return this.http
      .post<any>(
        `${this.API_URL}/courses/${topic.courseId}/topics/${topic._id}/channel`,
        channel
      )
      .pipe(
        catchError((errResponse, sourceObservable) => {
          if (errResponse.status === 404) {
            return of({ errorMsg: errResponse.error.error });
          } else {
            return of({
              errorMsg: 'Error in connection: Please reload the application',
            });
          }
        }),
        tap((res) => {
          if (!('errorMsg' in res)) {
            this.topics.forEach((topic, index) => {
              if (
                topic._id.toString() === res.savedChannel.topicId.toString()
              ) {
                const newChannels = [...topic.channels, res.savedChannel];
                const newTopic = { ...topic, channels: newChannels };
                this.topics[index] = newTopic;
              }
            });
            this.onUpdateTopics$.next(this.topics);
            this.store.dispatch(
              CourseActions.setChannelNotificationSettingsSuccess({
                updatedDoc: res.updatedNotificationSettings,
              })
            );
          }
        })
      );
  }

  /**
   * @function deleteChannel
   * Delete a channel in the backend
   *
   * @param {Channel} channelTD the channel to be deleted
   *
   */
  deleteChannel(channelTD: Channel) {
    return this.http
      .delete(
        `${this.API_URL}/courses/${channelTD.courseId}/channels/${channelTD._id}`
      )
      .pipe(
        catchError((errResponse, sourceObservable) => {
          if (errResponse.status === 404) {
            return of({ errorMsg: errResponse.error.error });
          } else {
            return of({
              errorMsg: 'Error in connection: Please reload the application',
            });
          }
        }),
        tap((res) => {
          if (!('errorMsg' in res)) {
            this.removeChannlFromTopic(channelTD);
          }
        })
      );
  }

  /**
   * @function removeChannlFromTopic
   * Delete a channel from the frontend data model
   *
   * @param {Channel} channelTD the channel to be deleted
   *
   */
  removeChannlFromTopic(channelTD) {
    let cIndex = null;
    let tIndex = null;
    this.topics.map((topic, i) => {
      if (topic._id === channelTD.topicId) {
        tIndex = i;
        cIndex = topic.channels.findIndex((channel) => {
          return channel._id === channelTD._id;
        });
      }
    });
    if (cIndex !== -1 && cIndex !== null && tIndex !== null) {
      this.topics[tIndex].channels.splice(cIndex, 1);
      this.onUpdateTopics$.next(this.topics);
    }
  }

  renameChannel(channelTD: Channel, chId: string, newName: any) {
    return this.http
      .put<any>(
        `${this.API_URL}/courses/${channelTD.courseId}/channels/${chId}`,
        newName
      )
      .pipe(
        catchError((err, sourceObservable) => {
          return of({ errorMsg: err.error.error });
        })
      );
  }

  getSelectedTopic(): Topic {
    return this.selectedTopic;
  }

  sendTopicToOldBackend(topic, courseId) {
    // userId should be taken from the coockies. for the time being it is hard coded
    this.http
      .post<any>('http://localhost:8090/new/topic', {
        _id: topic._id,
        topic: topic.name,
        courseID: courseId,
        userID: this.user.id,
      })
      .subscribe();
  }

  sendChannelToOldBackend(channel) {
    // userId should be taken from the coockies. for the time being it is hard coded
    this.http
      .post<any>('http://localhost:8090/new/channel', {
        _id: channel._id,
        courseID: channel.courseId,
        topicID: channel.topicId,
        name: channel.name,
        description: channel.description,
        userID: this.user.id,
      })
      .subscribe();
  }

  selectChannel(channel: Channel) {
    // if there is no selected course then no need to update the topics.
    /*if (this.getSelectedCourse()._id && course._id){
      this.topicChannelService.updateTopics(course._id);
    }*/
    this.selectedChannel = channel;

    //2
    this.onSelectChannel.emit(channel);
  }

  getChannelDetails(channel): Observable<Channel[]> {
    return this.http
      .get<{
        channel: Channel[];
        notificationSettings: BlockingNotifications;
      }>(`${this.API_URL}/courses/${channel.courseId}/channels/${channel._id}`)
      .pipe(
        map((res) => res.channel),
        tap((channels) => {
          this.channels = channels;
        })
      );
  }

  getChannel(courseId: string, channelId: string): Observable<Channel> {
    return this.http
      .get<{
        channel: Channel;
        notificationSettings: BlockingNotifications;
      }>(`${this.API_URL}/courses/${courseId}/channels/${channelId}`)
      .pipe(map((res) => res.channel));
  }

  logChannel(courseId: string, channelId: string): Observable<any> {
    return this.http.get<Course>(
      `${this.API_URL}/courses/${courseId}/channels/${channelId}/log`
    );
  }
  logAccessTopicDashboard(topicId: string): Observable<any> {
    return this.http.post(`${this.API_URL}/topics/${topicId}/log-dashboard`, {
      topicId,
    });
  }
  logAccessChannelDashboard(channelId: string): Observable<any> {
    return this.http.post(
      `${this.API_URL}/channels/${channelId}/log-dashboard`,
      {
        channelId,
      }
    );
  }
}
