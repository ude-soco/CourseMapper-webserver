import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopulateDashboardComponent } from './populate-dashboard.component';

describe('PopulateDashboardComponent', () => {
  let component: PopulateDashboardComponent;
  let fixture: ComponentFixture<PopulateDashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PopulateDashboardComponent]
    });
    fixture = TestBed.createComponent(PopulateDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
