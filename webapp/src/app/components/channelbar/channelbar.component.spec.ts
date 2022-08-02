import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelbarComponent } from './channelbar.component';

describe('ChannelbarComponent', () => {
  let component: ChannelbarComponent;
  let fixture: ComponentFixture<ChannelbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChannelbarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChannelbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
