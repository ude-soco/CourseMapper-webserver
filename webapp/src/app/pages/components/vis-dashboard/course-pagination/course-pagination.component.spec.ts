import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoursePaginationComponent } from './course-pagination.component';

describe('CoursePaginationComponent', () => {
  let component: CoursePaginationComponent;
  let fixture: ComponentFixture<CoursePaginationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CoursePaginationComponent]
    });
    fixture = TestBed.createComponent(CoursePaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
