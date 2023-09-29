import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwitchInputComponent } from './switch-input.component';

describe('SwitchInputComponent', () => {
  let component: SwitchInputComponent;
  let fixture: ComponentFixture<SwitchInputComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SwitchInputComponent]
    });
    fixture = TestBed.createComponent(SwitchInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
