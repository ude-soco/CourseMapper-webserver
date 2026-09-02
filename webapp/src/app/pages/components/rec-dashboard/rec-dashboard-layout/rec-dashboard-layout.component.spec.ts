import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecDashboardLayoutComponent } from './rec-dashboard-layout.component';

describe('RecDashboardLayoutComponent', () => {
  let component: RecDashboardLayoutComponent;
  let fixture: ComponentFixture<RecDashboardLayoutComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecDashboardLayoutComponent]
    });
    fixture = TestBed.createComponent(RecDashboardLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
