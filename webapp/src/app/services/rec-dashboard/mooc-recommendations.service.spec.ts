import { TestBed } from '@angular/core/testing';

import { MoocRecommendationsService } from './mooc-recommendations.service';

describe('MoocRecommendationsService', () => {
  let service: MoocRecommendationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MoocRecommendationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
