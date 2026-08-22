import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {VisDashboardService, Course, CourseByCategory} from "../../../../services/vis-dashboard/vis-dashboard.service";
import {FilteredData} from "../../course-category-page/course-category-page.component";
import {CourseCarouselType} from "../../../components/vis-dashboard/carousel/course-carousel/course-carousel.component";


@Component({
  selector: 'app-find-by-topic-main',
  templateUrl: './find-by-topic-main.component.html',
  styleUrls: ['./find-by-topic-main.component.css']
})
export class FindByTopicMainComponent implements  OnInit {
  searchQuery: string = ''
  displayedCourses: CourseByCategory[];
  emittedCategory: string;
  loadedCoursesByCategory: CourseByCategory[] = []
  loadedCoursesCount: number= 0
  currentPage = 1;
  itemsPerPage = 5;
  languages: string[]
  ratings : string [] = []
  selectRatings: string [] = []
  selectLanguages: string[]=[]
  myRatings: number[];
  price:  string[]
  selectPrices: string[]
  myPrices : number[]

  constructor(private route: ActivatedRoute, private visDashboardService: VisDashboardService,
              private router: Router) {
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['query'];
    })
    this.emittedCategory = this.searchQuery
    this.getCoursesByTopicSearch(this.searchQuery.toLowerCase())
    this.getCoursesForPage(this.currentPage)
  }


  // await result based on the search query and update the filter options
getCoursesByTopicSearch(searchQuery:string){
    this.visDashboardService.getCoursesByConceptFind(searchQuery)
      .then((courses)=>{
        this.loadedCoursesByCategory = courses

        this.languages = courses.map((course)=> course.Language)
        this.selectLanguages = [...new Set(this.languages.filter((course)=> course.length < 15))]

        this.ratings = courses.map((course)=> course.Rating)
        this.selectRatings = [...new Set(this.ratings.filter((course)=> course.length < 7 && !isNaN(+course)))]
        this.myRatings= [...new Set((this.selectRatings.map((course)=> Math.floor(+course))))];

        this.price = courses.map((course)=> course.Price)
        this.selectPrices = [...new Set(this.price.filter((course)=> course.length < 10 && isNaN(+course)))]
        this.myPrices = this.selectPrices.map(price => {
          if (price === "Free") {
            return 0;
          } else {
            return parseFloat(price.replace(/[^\d.]/g, ''));
          }
        });
        this.loadedCoursesCount = courses?.length
        this.displayedCourses = courses?.slice(0,5)
      })
}

  onCourseClick(courseId: string): void {
    this.router.navigate(['/course-detail', courseId]);
  }

  showFilters: boolean =true
  noFilterResults: boolean =false

  toggleFilters() {
    this.showFilters = !this.showFilters
  }

  sortByPopular() {

  }

  changePage(page: number) {
    this.currentPage = page;
   this.getCoursesForPage(page);
  }

  private getCoursesForPage(page: number) {
    const startIndex = (page - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.loadedCoursesCount);
    this.displayedCourses = this.loadedCoursesByCategory.slice(startIndex, endIndex);
  }

  applyFilters(filterData: FilteredData) {
    let filteredCourses = [...this.loadedCoursesByCategory];

    if (filterData.price) {
      switch (filterData.price) {
        case 'Free':
          filteredCourses = filteredCourses.filter(course => (course.Price) === "Free");
          break;
        case 'Low':
          filteredCourses = filteredCourses.filter(course => parseFloat(course.Price) < 100);
          break;
        case 'Medium':
          filteredCourses = filteredCourses.filter(course => parseFloat(course.Price) >= 100 && parseFloat(course.Price) <= 500);
          break;
        case 'High':
          filteredCourses = filteredCourses.filter(course => parseFloat(course.Price) > 500);
          break;
        default:
          break;
      }
    }

    if (filterData.language && filterData.language !== 'nothing') {
      filteredCourses = filteredCourses.filter(course => course.Language === filterData.language);
    }

    if (filterData.rating  && filterData.rating !== 'nothing') {
      filteredCourses = filteredCourses.filter(course => Math.floor(+course.Rating) === Math.floor(+filterData.rating));
    }
    this.displayedCourses = filteredCourses.slice(0,5);
    this.loadedCoursesCount = filteredCourses.length;
    this.noFilterResults = filteredCourses.length === 0;


  }


    protected readonly CourseCarouselType = CourseCarouselType;
}
