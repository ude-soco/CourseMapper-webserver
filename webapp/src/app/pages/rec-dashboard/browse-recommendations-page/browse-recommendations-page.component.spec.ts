import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowseRecommendationsPageComponent } from './browse-recommendations-page.component';

describe('BrowseRecommendationsPageComponent', () => {
  let component: BrowseRecommendationsPageComponent;
  let fixture: ComponentFixture<BrowseRecommendationsPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BrowseRecommendationsPageComponent]
    });
    fixture = TestBed.createComponent(BrowseRecommendationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
