import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomRecommendationOptionComponent } from './custom-recommendation-option.component';

describe('CustomRecommendationOptionComponent', () => {
  let component: CustomRecommendationOptionComponent;
  let fixture: ComponentFixture<CustomRecommendationOptionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomRecommendationOptionComponent]
    });
    fixture = TestBed.createComponent(CustomRecommendationOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
