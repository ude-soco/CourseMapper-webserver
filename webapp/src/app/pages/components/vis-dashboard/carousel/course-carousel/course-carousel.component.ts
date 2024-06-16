import {Component, EventEmitter, Input, OnInit, Output,} from '@angular/core';
import {
  ConceptsByCategories,
  TeacherByPopularity,
  VisDashboardService
} from "../../../../../services/vis-dashboard/vis-dashboard.service";
import {ActivatedRoute, Router} from "@angular/router";
import {useToCamelCase} from "../../../../../utils/useToCamelCase";

export enum CourseCarouselType{
  MOST_POPULAR_COURSES="MOST_POPULAR",
  HIGHEST_RATED_COURSES="HIGHEST_RATED",
  MOST_POPULAR_TEACHERS = "MOST_POPULAR_TEACHERS",
  MOST_POPULAR_TOPICS = "MOST_POPULAR_TOPICS"
}

interface CoursesByPopularity{
  CourseId: string;
  TeacherName:string;
  CourseName:string;
  NumberOfParticipants: number
}

interface CoursesByRating{
  CourseId: string;
  TeacherName:string;
  CourseName:string;
  Rating: number
}

@Component({
  selector: 'app-course-carousel',
  templateUrl: './course-carousel.component.html',
  styleUrls: ['./course-carousel.component.css']
})
export class CourseCarouselComponent implements OnInit{
  currentPosition = 0;
  cardsPerPage = 5;
  @Input() type: CourseCarouselType;
  @Output() courseClicked = new EventEmitter<string>()

  onCourseClick(courseId:string){
    this.courseClicked.emit(courseId)
    this.router.navigate(['course-detail', courseId])
  }

  onTeacherClick(teacherId: string) {
    this.router.navigate(['teacher-detail', teacherId])
  }

  onTopicClick(conceptId: string) {
    this.router.navigate(['find-moocs-by-topic-main'], { queryParams: { query: conceptId } });
  }

  mostPopularPlatforms: string[] = ['Udemy', 'Future Learn', 'Imoox',];
  highestRatedPlatforms: string[] = ['Udemy', 'Future Learn', 'Coursera'];
  popularTopicsPlatform: string[] = []

  popularCourses:CoursesByPopularity[]=[]
  ratedCourses: CoursesByRating[]=[]
  popularTeachers:TeacherByPopularity[]=[]
  popularTopics: ConceptsByCategories[]= []

  target: HTMLDivElement;
  emittedCategory: string;


  constructor(private visDashboardService:VisDashboardService,
              private router: Router,private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.emittedCategory = params['category'];
    });
    this.loadCourses();
  }

   loadCourses(): void {
    this.visDashboardService.getCoursesByPopularity("udemy")
      .then((courses) => {
        this.popularCourses  = courses
      })
      .catch((error) => {
        console.error('Error fetching courses:', error);
      });

    this.visDashboardService.getCoursesByRating("udemy")
      .then((courses) => {
        this.ratedCourses  = courses
      })
      .catch((error) => {
        console.error('Error fetching courses:', error);
      });

     this.visDashboardService.getPopularTeachers("udemy")
       .then((courses) => {
         this.popularTeachers  = courses
       })
       .catch((error) => {
         console.error('Error fetching courses:', error);
       });



     this.visDashboardService.getTopicsByCategory(this.emittedCategory.toLowerCase())
       .then((concepts) => {
         this.popularTopics  = concepts
         const platforms = new Set(concepts
           .map((platform)=> platform.PlatformName))
         this.popularTopicsPlatform = [...platforms].map((p)=>{
           return useToCamelCase(p)
         })
       })
       .catch((error) => {
         console.error('Error fetching courses:', error);
       });


   }

  async onPlatformSelected(platform: string) {
    this.popularCourses = await this.visDashboardService
      .getCoursesByPopularity(platform.toLowerCase())

    this.ratedCourses = await this.visDashboardService
      .getCoursesByRating(platform.toLowerCase())

    this.popularTeachers = await this.visDashboardService
      .getPopularTeachers(platform.toLowerCase())

  }


  scrollForward() {
    const nextPosition = this.currentPosition + this.cardsPerPage;
    if (nextPosition < this.popularCourses.length) {
      this.currentPosition = nextPosition;
    }
  }
  scrollBackward() {
    const nextPosition = this.currentPosition - this.cardsPerPage;
    if (nextPosition >= 0) {
      this.currentPosition = nextPosition;
    }
  }


}
