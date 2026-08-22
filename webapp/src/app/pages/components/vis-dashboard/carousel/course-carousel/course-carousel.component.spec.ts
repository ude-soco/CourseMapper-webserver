import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseCarouselComponent } from './course-carousel.component';

describe('CourseCarouselComponent', () => {
  let component: CourseCarouselComponent;
  let fixture: ComponentFixture<CourseCarouselComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CourseCarouselComponent]
    });
    fixture = TestBed.createComponent(CourseCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
