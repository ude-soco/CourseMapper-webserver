import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {VisDashboardService, Platform} from "../../../services/vis-dashboard/vis-dashboard.service";


type FilteredData = {
  language: string
}

@Component({
  selector: 'app-vis-explore-page',
  templateUrl: './vis-explore-page.component.html',
  styleUrls: ['./vis-explore-page.component.css']
})
export class VisExplorePageComponent implements OnInit {
  platforms: Platform[] = [];
  displayedPlatforms: Platform[] = [];
  selectedPlatform: string | null = ''
  isExploreButtonDisabled: boolean = true
  showEnglishPlatforms: boolean = true;
  showGermanPlatforms: boolean = true;


  constructor(private router: Router, private visDashboardService: VisDashboardService) {
  }

  ngOnInit(): void {
    this.getPlatforms()
  }


  exploreCourse() {
    if (this.selectedPlatform) {
      this.router.navigate(['explore-moocs', this.selectedPlatform]);
    }
  }

  getPlatforms() {
    this.visDashboardService.getPlatforms().then((platform) => {
      this.platforms = platform
      this.displayedPlatforms = platform
    })
  }

  updateButtonState() {
    this.isExploreButtonDisabled = !this.selectedPlatform;
  }


  onCheckboxChange() {
    this.displayedPlatforms = this.platforms.filter(platform => {
      if (this.showEnglishPlatforms && platform.PlatformLanguage === 'English') {
        return true;
      }
      if (this.showGermanPlatforms && platform.PlatformLanguage === 'German') {
        return true;
      }
      return false;
    });
  }


}
