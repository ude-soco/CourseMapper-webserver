import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisFilterSliderComponent } from './vis-filter-slider.component';

describe('VisFilterSliderComponent', () => {
  let component: VisFilterSliderComponent;
  let fixture: ComponentFixture<VisFilterSliderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VisFilterSliderComponent]
    });
    fixture = TestBed.createComponent(VisFilterSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
