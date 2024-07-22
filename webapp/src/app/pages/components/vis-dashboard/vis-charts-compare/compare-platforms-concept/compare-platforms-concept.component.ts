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
import {usePopularWords} from "../../../../../utils/usePopularWords";

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


  // await response and update the word cloud
  getConceptsByPlatforms(platforms: string[]) {
    this.isCloudLoading = true
    this.visDashboardService.getConceptsByPlatforms(platforms)
      .then((concepts) => {
        this.concepts = concepts
        this.words = this.concepts.map(c => c.ConceptName)
        const {data}= usePopularWords(this.words)
        this.data = data
        this.isCloudLoading = false
      })

  }



  getCoursesByPlatformAndConcepts(platforms: string[], concept: string) {
    this.visDashboardService.getCoursesByConceptForCompare(platforms,concept)
      .then((courses) => {
        this.relatedCourses = courses
      })
  }


  // Get course list on concept click
  onWorkClick(eventData: { event: MouseEvent; word: Word }) {
    this.selectedTopic = eventData.word.text
    this.getCoursesByPlatformAndConcepts(this.selectedPlatforms2, this.selectedTopic)
    this.topicClicked = true
  }


  onCourseClick(CourseId: string) {
    this.router.navigate(['course-detail', CourseId])
  }

}
