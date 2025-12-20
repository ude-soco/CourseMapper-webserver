import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EngagementDashboardComponent } from './engagement-dashboard.component';

describe('EngagementDashboardComponent', () => {
  let component: EngagementDashboardComponent;
  let fixture: ComponentFixture<EngagementDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EngagementDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EngagementDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

