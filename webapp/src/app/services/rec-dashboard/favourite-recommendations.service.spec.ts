import { TestBed } from '@angular/core/testing';

import { FavouriteRecommendationsService } from './favourite-recommendations.service';

describe('FavouriteRecommendationsService', () => {
  let service: FavouriteRecommendationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FavouriteRecommendationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
