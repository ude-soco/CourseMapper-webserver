import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {
  Concept,
  CourseByPlatformAndConcept,
  VisDashboardService
} from "../../../../../services/vis-dashboard/vis-dashboard.service";


interface Word {
  text: string,
  value: number,
  font: string,
  style: string,
  weight: string,
}

@Component({
  selector: 'app-concepts-word-cloud',
  templateUrl: './concepts-word-cloud.component.html',
  styleUrls: ['./concepts-word-cloud.component.css']
})
export class ConceptsWordCloudComponent implements OnInit {
  platform: string
  concepts: Concept[]
  data: { text: string; value: number; }[] = [{"text": "test", value: 0}]
  words: string[]
  myData: { text: string; value: number; }[]
  selectedTopic: string
  relatedCourses: CourseByPlatformAndConcept[] = []
  topicClicked: boolean = false
  isCloudLoading: boolean = true

  constructor(private route: ActivatedRoute,
              private visDashboardService: VisDashboardService,
              private router: Router) {
  }

  ngOnInit(): void {
    this.platform = this.route.snapshot.paramMap.get('platform');
    this.getConceptsByPlatform(this.platform.toLowerCase())
  }


  getConceptsByPlatform(platform: string) {
    this.isCloudLoading = true
    this.visDashboardService.getConceptsByPlatform(platform)
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

  getCoursesByPlatformAndConcepts(platform: string, concept: string) {
    this.visDashboardService.getCoursesByConceptAndPlatform(platform, concept)
      .then((courses) => {
        this.relatedCourses = courses
      })
  }


  onWorkClick(eventData: { event: MouseEvent; word: Word }) {
    this.selectedTopic = eventData.word.text
    this.getCoursesByPlatformAndConcepts(this.platform.toLowerCase(), this.selectedTopic)
    this.topicClicked = true
  }

  onCourseClick(CourseId: string) {
    this.router.navigate(['course-detail', CourseId])
  }
}
