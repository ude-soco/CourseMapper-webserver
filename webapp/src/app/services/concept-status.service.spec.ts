import { TestBed } from '@angular/core/testing';

import { ConceptStatusService } from './concept-status.service';

describe('ConceptStatusService', () => {
  let service: ConceptStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConceptStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
