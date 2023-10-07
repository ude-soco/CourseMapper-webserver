import { TestBed } from '@angular/core/testing';

import { Neo4jService } from './neo4j.service';

describe('Neo4jService', () => {
  let service: Neo4jService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Neo4jService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
