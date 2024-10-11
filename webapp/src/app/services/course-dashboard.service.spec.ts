import { TestBed } from '@angular/core/testing';

import { CourseDashboardService } from './course-dashboard.service';

describe('CourseDashboardService', () => {
  let service: CourseDashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CourseDashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
