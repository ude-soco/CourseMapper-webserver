import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalLevelNotificationSettingsComponent } from './global-level-notification-settings.component';

describe('GlobalLevelNotificationSettingsComponent', () => {
  let component: GlobalLevelNotificationSettingsComponent;
  let fixture: ComponentFixture<GlobalLevelNotificationSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GlobalLevelNotificationSettingsComponent]
    });
    fixture = TestBed.createComponent(GlobalLevelNotificationSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
