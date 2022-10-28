import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseSubscriptionsComponent } from './course-subscriptions.component';

describe('CourseSubscriptionsComponent', () => {
  let component: CourseSubscriptionsComponent;
  let fixture: ComponentFixture<CourseSubscriptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CourseSubscriptionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseSubscriptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
