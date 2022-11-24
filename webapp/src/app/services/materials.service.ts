import { EventEmitter, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Material, CreateMaterial } from '../models/Material';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MaterilasService {
  private API_URL = environment.API_URL;

  onSelectMaterial = new EventEmitter<CreateMaterial>();
  private selectedMaterial: CreateMaterial;
  constructor(private http: HttpClient) { }

  selectMaterial(material: CreateMaterial){
    // if there is no selected course then no need to update the topics.
    /*if (this.getSelectedCourse()._id && course._id){      
      this.topicChannelService.updateTopics(course._id);
    }*/
    this.selectedMaterial = material;    
    //2
    this.onSelectMaterial.emit(material);
  }

  addMaterial(material: CreateMaterial) : any {
    return this.http.post<any>(`${this.API_URL}/courses/${material.courseID}/channels/${material.channelID}/material`, {type:material.type, url:material.url,name: material.name,  description: material.description})
    .pipe(
      catchError(( err) => {
       if (err.status ===  403) {
        return of({errorMsg: err.error.error });
       }else {
        return of({errorMsg: "Error in connection: Please reload the application" })
       }
    }),
      tap(res => console.log(res)));
  }
  
  uploadFile(formData:any, materialType: string = 'pdf'):any{
    if (materialType == "video") {
      return this.http.post<any>(`${this.API_URL}/upload/video`,  formData ).pipe(tap(res => console.log(res)));
    }

    return this.http.post<any>(`${this.API_URL}/upload/pdf`,  formData ).pipe(tap(res => console.log(res)));
  }
}
