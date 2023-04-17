import { TestBed } from '@angular/core/testing';

import { ConceptSlideService } from './concept-slide.service';

describe('ConceptSlideService', () => {
  let service: ConceptSlideService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConceptSlideService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
