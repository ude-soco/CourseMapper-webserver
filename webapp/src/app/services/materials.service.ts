import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ActiveChannel, ActiveMaterial, Material } from '../model/material';

@Injectable({
  providedIn: 'root',
})
export class MaterialsService {
  public material = new Subject<Material>();
  material$ = this.material.asObservable();
  public selectedChannel = new Subject<ActiveChannel>();
  selectedChannel$ = this.selectedChannel.asObservable();

  public activeMaterial = new Subject<ActiveMaterial>();
  activeMaterial$ = this.activeMaterial.asObservable();

  public highlightMaterials = new Subject<string[]>();
  highlightMaterials$ = this.highlightMaterials.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * @function getMaterials
   * Return all of the materials from a channel of a course
   *
   * @param {courseId} string id of the course
   * @param {channelId} string id of the channel
   *
   */
  getMaterials(courseId: string, channelId: string) {
    return this.http
      .get(
        environment.API_URL +
          '/courses/' +
          courseId +
          '/channels/' +
          channelId +
          '/materials'
      )
      .pipe(
        tap((data: any) => {
          this.material.next(data.foundMaterials);
        })
      );
  }
}
