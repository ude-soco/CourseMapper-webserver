import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseByCategoryComponent } from './course-by-category.component';

describe('CourseByCategoryComponent', () => {
  let component: CourseByCategoryComponent;
  let fixture: ComponentFixture<CourseByCategoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CourseByCategoryComponent]
    });
    fixture = TestBed.createComponent(CourseByCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
