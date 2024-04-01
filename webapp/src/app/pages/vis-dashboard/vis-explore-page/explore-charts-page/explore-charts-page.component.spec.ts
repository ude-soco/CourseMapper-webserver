import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExploreChartsPageComponent } from './explore-charts-page.component';

describe('ExploreChartsPageComponent', () => {
  let component: ExploreChartsPageComponent;
  let fixture: ComponentFixture<ExploreChartsPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExploreChartsPageComponent]
    });
    fixture = TestBed.createComponent(ExploreChartsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
