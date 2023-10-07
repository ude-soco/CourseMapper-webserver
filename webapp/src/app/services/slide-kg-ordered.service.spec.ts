import { TestBed } from '@angular/core/testing';

import { SlideKgOrderedService } from './slide-kg-ordered.service';

describe('SlideKgOrderedService', () => {
  let service: SlideKgOrderedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SlideKgOrderedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
