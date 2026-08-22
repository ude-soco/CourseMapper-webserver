import { TestBed } from '@angular/core/testing';

import { PlatformFilterCompareService } from './platform-filter-compare.service';

describe('PlatformFilterCompareService', () => {
  let service: PlatformFilterCompareService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlatformFilterCompareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
