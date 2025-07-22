import { TestBed } from '@angular/core/testing';

import { CanDeactivateService } from './can-deactivate.service';

describe('CanDeactivateService', () => {
  let service: CanDeactivateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CanDeactivateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
