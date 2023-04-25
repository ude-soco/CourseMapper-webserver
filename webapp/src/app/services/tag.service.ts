import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Channel } from '../models/Channel';
import { Tag } from '../models/Tag';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TagService {

  constructor(private http: HttpClient,) { }

  getAllTagsForCurrentChannel(channel: Channel): Observable<Tag[]>{
    return this.http.get<Tag[]>(`${environment.apiUrl}/courses/${channel.courseId}/channels/${channel._id}/tags`);
  }
}
