import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseDescriptionComponent } from './course-description.component';

describe('CourseDescriptionComponent', () => {
  let component: CourseDescriptionComponent;
  let fixture: ComponentFixture<CourseDescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CourseDescriptionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
