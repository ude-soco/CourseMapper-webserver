import {Component, OnInit} from '@angular/core';
import {VisDashboardService} from "../../../../services/vis-dashboard/vis-dashboard.service";
import {PlatformFilterCompareService} from "../../../../services/vis-dashboard/platform-filter-compare.service";
import {
  VisSelectedPlatformsCompareService
} from "../../../../services/vis-dashboard/vis-selected-platforms-compare.service";
import {useSelectedPlatforms} from "../../../../utils/useSelectedPlatforms";
import {useToCamelCase} from "../../../../utils/useToCamelCase";

@Component({
  selector: 'app-compare-charts-page',
  templateUrl: './compare-charts-page.component.html',
  styleUrls: ['./compare-charts-page.component.css']
})
export class CompareChartsPageComponent implements OnInit {
  selectedPlatforms: string[] = [];
  showEnglishPlatforms: boolean
  showGermanPlatforms: boolean
  germanPlatforms: string[]
  englishPlatforms: string[]
  selectedPlatformsFromStorage: string[] = [];
  selectedPlatforms2: string[] = []



  ngOnInit(): void {
    this.loadSelectedPlatforms()
    this.getPlatformsFromServer()
    this.loadSelectedPlatformsFromStorage()

  }

  constructor(private visDashboardService: VisDashboardService,
              private platformFilterCompareService: PlatformFilterCompareService,
              private visSelectedPlatformsCompare: VisSelectedPlatformsCompareService) {
  }

  loadSelectedPlatforms() {
    this.visSelectedPlatformsCompare.getSelectedPlatforms().subscribe(platforms => {
      this.selectedPlatforms = platforms
    })
  }

  hasSelectedEnglishPlatform(): boolean {
    if (!this.englishPlatforms) {
      return false
    }
    return this.selectedPlatforms.some(platform => this.englishPlatforms.includes(platform))
  || this.selectedPlatformsFromStorage.some(platform => this.englishPlatforms.includes(platform))

  }

  hasSelectedGermanPlatform(): boolean {
    if (!this.germanPlatforms) {
      return false
    }
    return this.selectedPlatforms.some(platform => this.germanPlatforms.includes(platform))
    || this.selectedPlatformsFromStorage.some(platform => this.germanPlatforms.includes(platform))
    ;
  }


  getPlatformsFromServer() {
    this.visDashboardService.getPlatforms().then((platform) => {
      const engPL = platform.map(platform => platform)
        .filter(platform => platform.PlatformLanguage === "English")
      this.englishPlatforms = engPL.map(p => p.PlatformName)

      const gerPL = platform.map(platform => platform)
        .filter(platform => platform.PlatformLanguage === "German")
      this.germanPlatforms = gerPL.map(p => p.PlatformName)
    })

  }


  loadSelectedPlatformsFromStorage(): void {
    const storedPlatforms = localStorage.getItem('selectedPlatforms');
    if (storedPlatforms) {
    this.selectedPlatformsFromStorage = JSON.parse(storedPlatforms);
    const plats: string[] = JSON.parse(storedPlatforms);
   this.selectedPlatforms2 = plats.map((P)=> useToCamelCase(P) )
    }
  }



  onCheckboxChange() {
    let platformsToShow: string[] = [];
    useSelectedPlatforms(this.selectedPlatforms,this.selectedPlatformsFromStorage).forEach(platform => {
      if ((this.showEnglishPlatforms  && this.englishPlatforms.includes(platform)) ||
        (this.showGermanPlatforms  && this.germanPlatforms.includes(platform))) {
        platformsToShow.push(platform);
      }
    });
    if (!this.showEnglishPlatforms && !this.showGermanPlatforms) {
      platformsToShow = [...useSelectedPlatforms(this.selectedPlatforms,this.selectedPlatformsFromStorage)];
    }
    this.platformFilterCompareService.setLanguageFilter(platformsToShow);
  }
}
