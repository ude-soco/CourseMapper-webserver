import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisBackButtonComponent } from './vis-back-button.component';

describe('VisBackButtonComponent', () => {
  let component: VisBackButtonComponent;
  let fixture: ComponentFixture<VisBackButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VisBackButtonComponent]
    });
    fixture = TestBed.createComponent(VisBackButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
