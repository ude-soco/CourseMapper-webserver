interface CourseCategory {
  entity: string;
  course_category: string;
}

export function filterAndSelectCategories(categories: CourseCategory[]): string[] {
  const filteredCategories = categories.filter(category =>
    category.course_category !== "this information is not avaliable for this course"
  );
  const shuffledCategories = shuffle(filteredCategories);
  const selectedCategories = shuffledCategories.slice(0, 10);
  const selectedCategoryNames = selectedCategories.map(category => category.course_category);
  return selectedCategoryNames;
}

function shuffle(array: any[]): any[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
