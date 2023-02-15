import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfReplyItemComponent } from './pdf-reply-item.component';

describe('PdfReplyItemComponent', () => {
  let component: PdfReplyItemComponent;
  let fixture: ComponentFixture<PdfReplyItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdfReplyItemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfReplyItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
