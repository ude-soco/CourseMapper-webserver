import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StackedColumnComponentComponent } from './stacked-column-component.component';

describe('StackedColumnComponentComponent', () => {
  let component: StackedColumnComponentComponent;
  let fixture: ComponentFixture<StackedColumnComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StackedColumnComponentComponent]
    });
    fixture = TestBed.createComponent(StackedColumnComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
