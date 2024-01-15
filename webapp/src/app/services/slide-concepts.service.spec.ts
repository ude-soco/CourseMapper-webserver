import { TestBed } from '@angular/core/testing';

import { SlideConceptsService } from './slide-concepts.service';

describe('SlideConceptsService', () => {
  let service: SlideConceptsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SlideConceptsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
