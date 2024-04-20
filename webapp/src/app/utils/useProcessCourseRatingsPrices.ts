import {CoursesRatingsPricesForVis} from "../services/vis-dashboard/vis-dashboard.service";


export function processCourses(courses:CoursesRatingsPricesForVis[]) {
  const filteredCourses: [number, number][] = [];

  for (const course of courses) {
    const { CoursePrice, CourseRating } = course;

    if (CoursePrice.length <= 8 && CourseRating.length <= 9) {
      const priceWithoutCurrency = CoursePrice.replace(/[€$]/g, '');
      filteredCourses.push([+priceWithoutCurrency,+CourseRating]);
    }
  }
  return filteredCourses
}
