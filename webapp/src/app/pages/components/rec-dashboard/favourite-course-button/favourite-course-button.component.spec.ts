import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavouriteCourseButtonComponent } from './favourite-course-button.component';

describe('FavouriteCourseButtonComponent', () => {
  let component: FavouriteCourseButtonComponent;
  let fixture: ComponentFixture<FavouriteCourseButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FavouriteCourseButtonComponent]
    });
    fixture = TestBed.createComponent(FavouriteCourseButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
