import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EngagementChartsComponent } from './engagement-charts.component';

describe('EngagementChartsComponent', () => {
  let component: EngagementChartsComponent;
  let fixture: ComponentFixture<EngagementChartsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EngagementChartsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EngagementChartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

