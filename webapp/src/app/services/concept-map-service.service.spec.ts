import { TestBed } from '@angular/core/testing';

import { ConceptMapServiceService } from './concept-map-service.service';

describe('ConceptMapServiceService', () => {
  let service: ConceptMapServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConceptMapServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
