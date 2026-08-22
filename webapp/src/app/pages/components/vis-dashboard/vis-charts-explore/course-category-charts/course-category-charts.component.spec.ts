import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseCategoryChartsComponent } from './course-category-charts.component';

describe('CourseCategoryChartsComponent', () => {
  let component: CourseCategoryChartsComponent;
  let fixture: ComponentFixture<CourseCategoryChartsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CourseCategoryChartsComponent]
    });
    fixture = TestBed.createComponent(CourseCategoryChartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
