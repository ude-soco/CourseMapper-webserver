import { TestBed } from '@angular/core/testing';

import { TopicChannelService } from './topic-channel.service';

describe('TopicChannelService', () => {
  let service: TopicChannelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TopicChannelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
