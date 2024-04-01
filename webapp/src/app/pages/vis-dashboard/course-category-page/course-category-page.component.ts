import { Component,OnInit} from '@angular/core';
import {CourseCarouselType} from "../../components/vis-dashboard/carousel/course-carousel/course-carousel.component";
import {ActivatedRoute, Router} from '@angular/router';
import {CourseByCategory, VisDashboardService} from "../../../services/vis-dashboard/vis-dashboard.service";
import {useFilterCourses} from "../../../utils/useFilterCourses";


export type FilteredData = {
  rating:number,
  level?:string,
  language?: string,
  price?: number | number
}



@Component({
  selector: 'app-course-category-page',
  templateUrl: './course-category-page.component.html',
  styleUrls: ['./course-category-page.component.css']
})
export class CourseCategoryPageComponent implements OnInit{
  displayedCourses: CourseByCategory[];
  emittedCategory: string;
  loadedCoursesByCategory: CourseByCategory[] = []
  loadedCoursesCount: number= 0
  currentPage = 1;
  itemsPerPage = 5;


  constructor(private route: ActivatedRoute,private visDashboardService:VisDashboardService,
              private router:Router) {

  }
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.emittedCategory = params['category'];
    });
    this.getCoursesByCategory(this.emittedCategory.toLowerCase())
    this.getCoursesForPage(this.currentPage);
  }

  getCoursesByCategory(courseCategory:string){
    this.visDashboardService.getCoursesByCourseCategory(courseCategory).then((courses)=>{
      this.loadedCoursesByCategory = courses
      this.loadedCoursesCount = courses?.length
    })
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

  onCourseClick(courseId: string): void {
    this.router.navigate(['/course-detail', courseId]);
  }

  protected readonly CourseCarouselType = CourseCarouselType;
  showFilters: boolean =true
  noFilterResults: boolean =false
  toggleFilters() {
    this.showFilters = !this.showFilters
  }


  sortByPopular() {

  }

  applyFilters(filterData: FilteredData) {
    let filteredCourses = [...this.loadedCoursesByCategory]
    useFilterCourses(filterData,filteredCourses)
    this.displayedCourses = filteredCourses
    this.loadedCoursesCount = filteredCourses.length
    if (filteredCourses.length === 0) {
      this.noFilterResults = true

    }
  }
}
