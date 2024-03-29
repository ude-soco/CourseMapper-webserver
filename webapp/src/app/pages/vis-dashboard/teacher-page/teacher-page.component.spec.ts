import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherPageComponent } from './teacher-page.component';

describe('TeacherPageComponent', () => {
  let component: TeacherPageComponent;
  let fixture: ComponentFixture<TeacherPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TeacherPageComponent]
    });
    fixture = TestBed.createComponent(TeacherPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
