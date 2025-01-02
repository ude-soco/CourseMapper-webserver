import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestEmailValidationComponent } from './request-email-validation.component';

describe('RequestEmailValidationComponent', () => {
  let component: RequestEmailValidationComponent;
  let fixture: ComponentFixture<RequestEmailValidationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RequestEmailValidationComponent]
    });
    fixture = TestBed.createComponent(RequestEmailValidationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
