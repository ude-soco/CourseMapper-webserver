import { Component,OnInit } from '@angular/core';
import {
  Concept,
  VisDashboardService,
  CourseConceptCompare,
} from "../../../../../services/vis-dashboard/vis-dashboard.service";
import { Router} from "@angular/router";
import {PlatformFilterCompareService} from "../../../../../services/vis-dashboard/platform-filter-compare.service";
import {
  VisSelectedPlatformsCompareService
} from "../../../../../services/vis-dashboard/vis-selected-platforms-compare.service";
import {useSelectedPlatforms} from "../../../../../utils/useSelectedPlatforms";

interface Word {
  text: string,
  value: number,
  font: string,
  style: string,
  weight: string,
}

@Component({
  selector: 'app-compare-platforms-concept',
  templateUrl: './compare-platforms-concept.component.html',
  styleUrls: ['./compare-platforms-concept.component.css']
})
export class ComparePlatformsConceptComponent implements  OnInit{
  selectedPlatforms: string[]
  selectedPlatforms2: string[]
  concepts: Concept[]
  data: { text: string; value: number; }[] = [{"text": "test", value: 0}]
  words: string[]
  myData: { text: string; value: number; }[]
  selectedTopic: string
  relatedCourses: CourseConceptCompare[] = []
  topicClicked: boolean = false
  isCloudLoading: boolean = true

  constructor(
              private visDashboardService: VisDashboardService,
              private router: Router,
              private readonly visSelectedPlatformsCompare: VisSelectedPlatformsCompareService,
              private platformFilterCompare:PlatformFilterCompareService) {
  }

  ngOnInit(): void {
    this.loadSelectedPlatforms()
    this.loadSelectedPlatformsFromStorage();
   this.getConceptsByPlatforms(useSelectedPlatforms(this.selectedPlatforms,this.selectedPlatforms2))

    this.platformFilterCompare.getLanguageFilter().subscribe(platforms=>{
      if(platforms.length === 0 ){
        return
      }
      else{
        this.getConceptsByPlatforms(platforms)
      }
    })

  }

  loadSelectedPlatformsFromStorage(): void {
    const storedPlatforms = localStorage.getItem('selectedPlatforms');
    if (storedPlatforms) {
      this.selectedPlatforms = JSON.parse(storedPlatforms);
    }
  }

  loadSelectedPlatforms(): void {
    this.visSelectedPlatformsCompare.getSelectedPlatforms().subscribe(platforms=>{
   this.selectedPlatforms2 = platforms
    })
  }


  getConceptsByPlatforms(platforms: string[]) {
    this.isCloudLoading = true
    this.visDashboardService.getConceptsByPlatforms(platforms)
      .then((concepts) => {
        this.concepts = concepts
        //Todo get most important
        this.words = this.concepts.map(c => c.ConceptName)
        this.myData = this.words.map(function (d) {
          return {text: d, value: 10 + Math.random() * 90};
        })
        this.data = this.myData
        this.isCloudLoading = false
      })

  }



  getCoursesByPlatformAndConcepts(platforms: string[], concept: string) {
    this.visDashboardService.getCoursesByConceptForCompare(platforms,concept)
      .then((courses) => {
        //Todo Randomnize courses
        this.relatedCourses = courses
      })
  }

  onWorkClick(eventData: { event: MouseEvent; word: Word }) {
    this.selectedTopic = eventData.word.text
    this.getCoursesByPlatformAndConcepts(this.selectedPlatforms2, this.selectedTopic)
    this.topicClicked = true
  }


  onCourseClick(CourseId: string) {
    this.router.navigate(['course-detail', CourseId])
  }

}
