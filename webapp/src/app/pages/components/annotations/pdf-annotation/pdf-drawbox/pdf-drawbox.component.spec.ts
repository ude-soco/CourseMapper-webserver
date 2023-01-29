import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfDrawboxComponent } from './pdf-drawbox.component';

describe('PdfDrawboxComponent', () => {
  let component: PdfDrawboxComponent;
  let fixture: ComponentFixture<PdfDrawboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdfDrawboxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfDrawboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
