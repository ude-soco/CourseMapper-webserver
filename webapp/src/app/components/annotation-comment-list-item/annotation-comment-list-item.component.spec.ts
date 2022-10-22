import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationCommentListItemComponent } from './annotation-comment-list-item.component';

describe('AnnotationCommentListItemComponent', () => {
  let component: AnnotationCommentListItemComponent;
  let fixture: ComponentFixture<AnnotationCommentListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnnotationCommentListItemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnotationCommentListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
