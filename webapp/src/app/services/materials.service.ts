import { EventEmitter, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Material, CreateMaterial } from '../models/Material';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import * as CourseActions from '../pages/courses/state/course.actions';
import { Store } from '@ngrx/store';
import { State } from '../pages/courses/state/course.reducer';
import * as NotificationActions from '../pages/components/notifications/state/notifications.actions';
import { Neo4jService } from './neo4j.service';
@Injectable({
  providedIn: 'root',
})
export class MaterilasService {
  private API_URL = environment.API_URL;

  onSelectMaterial = new EventEmitter<CreateMaterial>();
  isMaterialSelected = new BehaviorSubject<boolean>(false);

  selectedMaterial: CreateMaterial;
  constructor(private http: HttpClient, private store: Store<State>,private neo4jservice: Neo4jService) {}


  getSelectedMaterial(): CreateMaterial{
    return this.selectedMaterial
  }
  selectMaterial(material: CreateMaterial) {
    // if there is no selected course then no need to update the topics.
    /*if (this.getSelectedCourse()._id && course._id){
      this.topicChannelService.updateTopics(course._id);
    }*/
    this.selectedMaterial = material;
    //2
    this.onSelectMaterial.emit(material);
  }

  addMaterial(material: CreateMaterial): any {
    return this.http
      .post<any>(
        `${this.API_URL}/courses/${material.courseId}/channels/${material.channelId}/material`,
        {
          type: material.type,
          url: material.url,
          name: material.name,
          description: material.description,
        }
      )
      .pipe(
        catchError((err) => {
          if (err.status === 403) {
            return of({ errorMsg: err.error.error });
          } else {
            return of({
              errorMsg: 'Error in connection: Please reload the application',
            });
          }
        }),
        map((res) => {
          return {
            material: res.savedMaterial,
            updatedNotificationSettings: res.updatedNotificationSettings,
          };
        }),
        tap((res) => {
          this.store.dispatch(
            CourseActions.setMaterialNotificationSettingsSuccess({
              updatedDoc: res.updatedNotificationSettings,
            })
          );
          return res;
        })
      );
  }

  logMaterial(courseId: string, materialId: string): Observable<any> {
    return this.http.get<CreateMaterial>(`${this.API_URL}/courses/${courseId}/materials/${materialId}`)
  }

  uploadFile(formData: any, materialType: string = 'pdf'): any {
    if (materialType == 'video') {
      return this.http
        .post<any>(`${this.API_URL}/upload/video`, formData)
        .pipe(tap((res) => console.log(res)));
    }

    return this.http
      .post<any>(`${this.API_URL}/upload/pdf`, formData)
      .pipe(tap((res) => console.log(res)));
  }

  deleteMaterial(material: Material) {
    return this.http
      .delete(
        `${this.API_URL}/courses/${material['courseId']}/materials/${material._id}`
      );
  }
  deleteFile(material: Material) {
    if (material.type == 'pdf') {
      return this.http
        .delete(`${this.API_URL}/files/${material._id + '.pdf'}`)
        .pipe(
          tap((res) => {
            //console.log(res)
          })
        );
    } else {
      return this.http
        .delete(`${this.API_URL}/videos/${material._id + '.mp4'}`)
        .pipe(
          tap((res) => {
            //console.log(res)
          })
        );
    }
  }

  renameMaterial(courseId: any, materialTD: Material, body: any) {
    return this.http
      .put<any>(
        `${this.API_URL}/courses/${courseId}/materials/${materialTD._id}`,
        body
      )
      .pipe(
        catchError((err, sourceObservable) => {
          return of({ errorMsg: err.error.error });
        })
      );
  }
}
