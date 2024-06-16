import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarouselForwardButtonComponent } from './carousel-forward-button.component';

describe('CarouselForwardButtonComponent', () => {
  let component: CarouselForwardButtonComponent;
  let fixture: ComponentFixture<CarouselForwardButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CarouselForwardButtonComponent]
    });
    fixture = TestBed.createComponent(CarouselForwardButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
