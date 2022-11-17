import { TestBed } from '@angular/core/testing';

import { MaterilasService } from './materials.service';

describe('MaterilasService', () => {
  let service: MaterilasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaterilasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
