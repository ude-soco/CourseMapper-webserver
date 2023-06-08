import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationDashboardComponent } from './notification-dashboard.component';

describe('NotificationDashboardComponent', () => {
  let component: NotificationDashboardComponent;
  let fixture: ComponentFixture<NotificationDashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NotificationDashboardComponent]
    });
    fixture = TestBed.createComponent(NotificationDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
