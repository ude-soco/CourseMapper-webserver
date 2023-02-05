import { formatDate } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs';
import { Channel } from '../models/Channel';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  cmEndpointURL = "http://localhost:5000/";

  constructor(private http: HttpClient) { }


  getDashboard(channel: Channel){ 
  const formData = new FormData()
  formData.append('ChannelID',channel._id)
  formData.append('name',channel.name)
  //  return this.http.post<any>(`${this.cmEndpointURL}dashboard`,{ChannelID:channel._id, name:channel.name}  )
   return this.http.post<any>(`${this.cmEndpointURL}dashboard`,formData  )
   .pipe(
    tap(res =>{
      console.log(res)    
      }) 
       ) 
     }
}
