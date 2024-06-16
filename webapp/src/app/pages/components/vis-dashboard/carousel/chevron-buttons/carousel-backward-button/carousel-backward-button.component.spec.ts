import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarouselBackwardButtonComponent } from './carousel-backward-button.component';

describe('CarouselBackwardButtonComponent', () => {
  let component: CarouselBackwardButtonComponent;
  let fixture: ComponentFixture<CarouselBackwardButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CarouselBackwardButtonComponent]
    });
    fixture = TestBed.createComponent(CarouselBackwardButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
