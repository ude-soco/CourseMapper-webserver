import { EventEmitter, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Material } from '../models/Material';

@Injectable({
  providedIn: 'root'
})
export class MaterilasService {
  private API_URL = environment.API_URL;
  onSelectMaterial = new EventEmitter<Material>();
  private selectedMaterial: Material;
  constructor() { }

  selectMaterial(material: Material){
    // if there is no selected course then no need to update the topics.
    /*if (this.getSelectedCourse()._id && course._id){      
      this.topicChannelService.updateTopics(course._id);
    }*/
    this.selectedMaterial = material;    
    //2
    this.onSelectMaterial.emit(material);
  }
}
