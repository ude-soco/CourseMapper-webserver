import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagReplyPanelComponent } from './tag-reply-panel.component';

describe('TagReplyPanelComponent', () => {
  let component: TagReplyPanelComponent;
  let fixture: ComponentFixture<TagReplyPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TagReplyPanelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagReplyPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
