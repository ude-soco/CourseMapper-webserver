import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseHoverOverviewComponent } from './course-hover-overview.component';

describe('CourseHoverOverviewComponent', () => {
  let component: CourseHoverOverviewComponent;
  let fixture: ComponentFixture<CourseHoverOverviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CourseHoverOverviewComponent]
    });
    fixture = TestBed.createComponent(CourseHoverOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
