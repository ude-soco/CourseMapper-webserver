import { TestBed } from '@angular/core/testing';

import { NodeClickService } from './node-click.service';

describe('NodeClickService', () => {
  let service: NodeClickService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NodeClickService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
