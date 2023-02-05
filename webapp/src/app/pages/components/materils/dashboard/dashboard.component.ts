import { Component, Input, OnInit } from '@angular/core';
import { Channel } from 'src/app/models/Channel';
import { DashboardService } from 'src/app/services/dashboard.service';
import {DialogModule} from 'primeng/dialog';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
   @Input() public channelEmittd :any ;
  selectedChannel:Channel;
  result:any;
  display: boolean = false;
   constructor(private dashboardService:DashboardService) { }

  ngOnInit(): void {

  }
dashboardmonitor()  
{    
  console.log('triggered')    
  this.selectedChannel = this.channelEmittd  
     console.log(this.selectedChannel) 
 this.dashboardService.getDashboard(this.selectedChannel).subscribe({   
     next: (data) => { 
      //this.result= [data.objInteractivityScore,data.objMotivationScore]  
      this.result= data
      this.display = true;
      console.log(data)
        }})  }
}
