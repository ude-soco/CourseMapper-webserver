import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisDashboardLayoutComponent } from './vis-dashboard-layout.component';

describe('VisDashboardLayoutComponent', () => {
  let component: VisDashboardLayoutComponent;
  let fixture: ComponentFixture<VisDashboardLayoutComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VisDashboardLayoutComponent]
    });
    fixture = TestBed.createComponent(VisDashboardLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
