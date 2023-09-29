import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseNotificationDashboardComponent } from './base-notification-dashboard.component';

describe('BaseNotificationDashboardComponent', () => {
  let component: BaseNotificationDashboardComponent;
  let fixture: ComponentFixture<BaseNotificationDashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BaseNotificationDashboardComponent]
    });
    fixture = TestBed.createComponent(BaseNotificationDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
