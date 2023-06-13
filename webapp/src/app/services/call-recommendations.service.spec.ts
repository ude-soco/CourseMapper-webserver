import { TestBed } from '@angular/core/testing';

import { CallRecommendationsService } from './call-recommendations.service';

describe('CallRecommendationsService', () => {
  let service: CallRecommendationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CallRecommendationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
