import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagCommentItemComponent } from './tag-comment-item.component';

describe('TagCommentItemComponent', () => {
  let component: TagCommentItemComponent;
  let fixture: ComponentFixture<TagCommentItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TagCommentItemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagCommentItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
