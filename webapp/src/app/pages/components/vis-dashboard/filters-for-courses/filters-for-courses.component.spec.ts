import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiltersForCoursesComponent } from './filters-for-courses.component';

describe('FiltersForCoursesComponent', () => {
  let component: FiltersForCoursesComponent;
  let fixture: ComponentFixture<FiltersForCoursesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FiltersForCoursesComponent]
    });
    fixture = TestBed.createComponent(FiltersForCoursesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
