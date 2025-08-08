import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColoredBandComponent } from './colored-band.component';

describe('ColoredBandComponent', () => {
  let component: ColoredBandComponent;
  let fixture: ComponentFixture<ColoredBandComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ColoredBandComponent]
    });
    fixture = TestBed.createComponent(ColoredBandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
