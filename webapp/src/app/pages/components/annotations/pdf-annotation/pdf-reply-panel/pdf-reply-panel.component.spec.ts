import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfReplyPanelComponent } from './pdf-reply-panel.component';

describe('PdfReplyPanelComponent', () => {
  let component: PdfReplyPanelComponent;
  let fixture: ComponentFixture<PdfReplyPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdfReplyPanelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfReplyPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
