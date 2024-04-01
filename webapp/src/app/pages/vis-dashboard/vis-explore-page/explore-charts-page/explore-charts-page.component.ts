import { Component,OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {VisDashboardService} from "../../../../services/vis-dashboard/vis-dashboard.service";

@Component({
  selector: 'app-explore-charts-page',
  templateUrl: './explore-charts-page.component.html',
  styleUrls: ['./explore-charts-page.component.css']
})
export class ExploreChartsPageComponent implements OnInit{
  platform:string

  constructor(private route: ActivatedRoute,
              private visDashboardService: VisDashboardService) {}
  ngOnInit(): void {
    this.platform = this.route.snapshot.paramMap.get('platform');
  }


}
