import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecommendationSearchComponent } from './recommendation-search.component';

describe('RecommendationSearchComponent', () => {
  let component: RecommendationSearchComponent;
  let fixture: ComponentFixture<RecommendationSearchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecommendationSearchComponent]
    });
    fixture = TestBed.createComponent(RecommendationSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
