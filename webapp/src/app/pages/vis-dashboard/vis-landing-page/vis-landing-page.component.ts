import { Component,OnInit } from '@angular/core';
import {VisDashboardService} from "../../../services/vis-dashboard/vis-dashboard.service";
import {filterAndSelectCategories} from "../../../utils/FillterSelectCategories";
import {CourseCarouselType} from "../../components/vis-dashboard/carousel/course-carousel/course-carousel.component";
interface OptionsType{
  text:string,
  link:string
}
@Component({
  selector: 'app-vis-landing-page',
  templateUrl: './vis-landing-page.component.html',
  styleUrls: ['./vis-landing-page.component.css']
})
export class VisLandingPageComponent implements  OnInit{
  protected readonly CourseCarouselType = CourseCarouselType;

  courseCategoryData:string[]=[]
  optionsData: OptionsType[] = []
  constructor(private readonly visDashboardService : VisDashboardService) {
    this.visDashboardService.getCourseCategories().then((courseCategories)=>{
     this.courseCategoryData= filterAndSelectCategories(courseCategories)
    })
  }

ngOnInit() {
  this.optionsData =[
    { text: 'Discover a MOOC/MOOC Insights', link:'/explore-moocs' },
    { text: 'Compare  MOOCs', link:'/compare-moocs' },
    { text: 'Find by Topics', link:'/find-moocs-by-topic' },]

  this.visDashboardService.addLangaugesToPlatforms().then(()=>{
  }).catch((error)=>{
    console.log(error)
  })
}




}
