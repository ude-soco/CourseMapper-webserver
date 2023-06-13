import { TestBed } from '@angular/core/testing';

import { MaterialsRecommenderService } from './materials-recommender.service';

describe('MaterialsRecommenderService', () => {
  let service: MaterialsRecommenderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaterialsRecommenderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
