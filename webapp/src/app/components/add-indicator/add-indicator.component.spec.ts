import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddIndicatorComponent } from './add-indicator.component';

describe('AddIndicatorComponent', () => {
  let component: AddIndicatorComponent;
  let fixture: ComponentFixture<AddIndicatorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddIndicatorComponent]
    });
    fixture = TestBed.createComponent(AddIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
