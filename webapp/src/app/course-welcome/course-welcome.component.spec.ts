import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseWelcomeComponent } from './course-welcome.component';

describe('CourseWelcomeComponent', () => {
  let component: CourseWelcomeComponent;
  let fixture: ComponentFixture<CourseWelcomeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CourseWelcomeComponent]
    });
    fixture = TestBed.createComponent(CourseWelcomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
