import { TestBed } from '@angular/core/testing';

import { ModeratorPrivilegesService } from './moderator-privileges.service';

describe('ModeratorPrivilegesService', () => {
  let service: ModeratorPrivilegesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModeratorPrivilegesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
