import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavouriteRecommendationsPageComponent } from './favourite-recommendations-page.component';

describe('FavouriteRecommendationsPageComponent', () => {
  let component: FavouriteRecommendationsPageComponent;
  let fixture: ComponentFixture<FavouriteRecommendationsPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FavouriteRecommendationsPageComponent]
    });
    fixture = TestBed.createComponent(FavouriteRecommendationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
