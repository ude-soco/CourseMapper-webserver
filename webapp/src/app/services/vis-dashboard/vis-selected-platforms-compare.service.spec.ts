import { TestBed } from '@angular/core/testing';

import { VisSelectedPlatformsCompareService } from './vis-selected-platforms-compare.service';

describe('VisSelectedPlatformsCompareService', () => {
  let service: VisSelectedPlatformsCompareService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisSelectedPlatformsCompareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
