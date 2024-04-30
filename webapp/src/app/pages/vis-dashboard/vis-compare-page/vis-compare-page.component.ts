import { Component,OnInit } from '@angular/core';
import {Router} from "@angular/router";
import {VisDashboardService} from "../../../services/vis-dashboard/vis-dashboard.service";
import { useGroupPlatforms} from "../../../utils/useGroupPlatforms";
import {Platform} from "../../../services/vis-dashboard/vis-dashboard.service";
import {
  VisSelectedPlatformsCompareService
} from "../../../services/vis-dashboard/vis-selected-platforms-compare.service";


@Component({
  selector: 'app-vis-compare-page',
  templateUrl: './vis-compare-page.component.html',
  styleUrls: ['./vis-compare-page.component.css']
})
export class VisComparePageComponent implements OnInit{
  platforms: Platform[] = [];
  selectedPlatforms: string[] | null = []
  groupedPlatforms: any[];

  constructor(private router:Router,
              private readonly  visSelectedPlatformsCompare: VisSelectedPlatformsCompareService,
              private visDashboardService: VisDashboardService) {
  }

  ngOnInit(): void {
    //Todo catch error
    this.getPlatforms().then(p=> p)

  }

  saveSelectedPlatformsToStorage(): void {
    localStorage.setItem('selectedPlatforms', JSON.stringify(this.selectedPlatforms));
  }

  async getPlatforms(){
    const platforms = await this.visDashboardService.getPlatforms()
    this.platforms = platforms
   this.groupedPlatforms= useGroupPlatforms(platforms)
  }


  comparePlatforms() {
    if (this.selectedPlatforms.length> 1) {
      this.router.navigate(['compare-moocs-vis']);
    }
  }


  onSelectChange() {
    this.saveSelectedPlatformsToStorage();
    this.visSelectedPlatformsCompare.setSelectedPlatforms(this.selectedPlatforms)
  }
}
