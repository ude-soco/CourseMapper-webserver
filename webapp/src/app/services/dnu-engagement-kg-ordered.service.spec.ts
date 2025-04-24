import { TestBed } from '@angular/core/testing';

import { DNUEngagementKgOrderedService } from './dnu-engagement-kg-ordered.service';

describe('DNUEngagementKgOrderedService', () => {
  let service: DNUEngagementKgOrderedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DNUEngagementKgOrderedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
