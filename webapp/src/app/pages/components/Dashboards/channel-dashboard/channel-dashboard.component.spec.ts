import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelDashboardComponent } from './channel-dashboard.component';

describe('ChannelDashboardComponent', () => {
  let component: ChannelDashboardComponent;
  let fixture: ComponentFixture<ChannelDashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChannelDashboardComponent]
    });
    fixture = TestBed.createComponent(ChannelDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
