import { TestBed } from '@angular/core/testing';

import { EngagementKgOrderedService } from './engagement-kg-ordered.service';

describe('EngagementKgOrderedService', () => {
  let service: EngagementKgOrderedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EngagementKgOrderedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
