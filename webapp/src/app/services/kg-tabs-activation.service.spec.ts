import { TestBed } from '@angular/core/testing';

import { KgTabsActivationService } from './kg-tabs-activation.service';

describe('KgTabsActivationService', () => {
  let service: KgTabsActivationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KgTabsActivationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
