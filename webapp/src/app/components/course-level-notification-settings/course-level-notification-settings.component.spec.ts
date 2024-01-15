import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseLevelNotificationSettingsComponent } from './course-level-notification-settings.component';

describe('CourseLevelNotificationSettingsComponent', () => {
  let component: CourseLevelNotificationSettingsComponent;
  let fixture: ComponentFixture<CourseLevelNotificationSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CourseLevelNotificationSettingsComponent]
    });
    fixture = TestBed.createComponent(CourseLevelNotificationSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
