import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagReplyItemComponent } from './tag-reply-item.component';

describe('TagReplyItemComponent', () => {
  let component: TagReplyItemComponent;
  let fixture: ComponentFixture<TagReplyItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TagReplyItemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagReplyItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
