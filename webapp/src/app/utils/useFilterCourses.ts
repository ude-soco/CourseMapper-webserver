import {FilteredData} from "../pages/vis-dashboard/course-category-page/course-category-page.component";
import {CourseByCategory} from "../services/vis-dashboard/vis-dashboard.service";

export function useFilterCourses(filterData: FilteredData, filteredCourses: CourseByCategory[]){
  if(filterData.price){
    if(filterData.price === 0){
      return
    }else{
      filteredCourses = filteredCourses.filter(course=> course.Price === filterData.price)
    }
  }


  if (filterData.language) {
    if(filterData.language === 'nothing'){
      return
    }else{
      filteredCourses = filteredCourses.filter(course => course.Language === filterData.language);
      console.log(filteredCourses)
    }

  }
  if (filterData.rating) {
    console.log(filterData.rating)
    if(filterData.rating === null){
      return
    }else{
      filteredCourses = filteredCourses.filter(course => Math.floor(+course.Rating) === filterData.rating)
      console.log(filteredCourses)
    }
  }

}
