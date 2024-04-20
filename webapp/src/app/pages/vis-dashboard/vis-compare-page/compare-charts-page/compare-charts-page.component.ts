import { Component, OnInit } from '@angular/core';
import {VisDashboardService} from "../../../../services/vis-dashboard/vis-dashboard.service";
import {PlatformFilterCompareService} from "../../../../services/vis-dashboard/platform-filter-compare.service";

@Component({
  selector: 'app-compare-charts-page',
  templateUrl: './compare-charts-page.component.html',
  styleUrls: ['./compare-charts-page.component.css']
})
export class CompareChartsPageComponent implements  OnInit{
  selectedPlatforms: string[] = [];
  showEnglishPlatforms: boolean
  showGermanPlatforms: boolean
  germanPlatforms : string[]
  englishPlatforms : string[]



  ngOnInit(): void {
    this.loadSelectedPlatformsFromStorage();
    for(const platform of this.selectedPlatforms){
      if((platform === "Coursera" || platform === "Future Learn"
        || platform === "Udacity" || platform ==="edX"
        || platform === "udemy") ){
        this.showEnglishPlatforms = true
      }else if(platform === "imoox" || platform === "OPEN vhb"
        || platform === "KI campus" || platform ==="on campus"
        || platform === "OPEN HPI"){
        this.showGermanPlatforms = true
      }
    }

    this.visDashboardService.getPlatforms().then((platform)=>{
      const engPL= platform.map(platform=> platform).filter(platform=> platform.PlatformLanguage === "English")
      this.englishPlatforms=engPL.map(p=> p.PlatformName)

      const gerPL= platform.map(platform=> platform).filter(platform=> platform.PlatformLanguage === "German")
      this.germanPlatforms= gerPL.map(p=> p.PlatformName)


    })
  }

  constructor(private visDashboardService: VisDashboardService,
              private platformFilterCompareService: PlatformFilterCompareService ) {
  }

  loadSelectedPlatformsFromStorage(): void {
    const storedPlatforms = localStorage.getItem('selectedPlatforms');
    if (storedPlatforms) {
    this.selectedPlatforms = JSON.parse(storedPlatforms);
    }
  }

   onCheckboxChange() {
    if(!this.showEnglishPlatforms && !this.showGermanPlatforms){
      this.showGermanPlatforms = false
      this.showGermanPlatforms = false
      this.platformFilterCompareService.setLanguageFilter([""])
    }



     if(!this.showGermanPlatforms){
       this.platformFilterCompareService.setLanguageFilter(this.englishPlatforms)
     }

     if(!this.showEnglishPlatforms ){
       this.platformFilterCompareService.setLanguageFilter(this.germanPlatforms)
     }

     if(this.showEnglishPlatforms && this.showGermanPlatforms){
       this.platformFilterCompareService.setLanguageFilter(this.germanPlatforms.concat(this.englishPlatforms))
     }


   }


}
