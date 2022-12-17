import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewPdfComponent } from './view-pdf.component';

describe('ViewPdfComponent', () => {
  let component: ViewPdfComponent;
  let fixture: ComponentFixture<ViewPdfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewPdfComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewPdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
