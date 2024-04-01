import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompareChartsPageComponent } from './compare-charts-page.component';

describe('CompareChartsPageComponent', () => {
  let component: CompareChartsPageComponent;
  let fixture: ComponentFixture<CompareChartsPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompareChartsPageComponent]
    });
    fixture = TestBed.createComponent(CompareChartsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
