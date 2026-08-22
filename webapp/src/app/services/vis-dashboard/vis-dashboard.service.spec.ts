import { TestBed } from '@angular/core/testing';

import { VisDashboardService } from './vis-dashboard.service';

describe('VisDashboardService', () => {
  let service: VisDashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisDashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
