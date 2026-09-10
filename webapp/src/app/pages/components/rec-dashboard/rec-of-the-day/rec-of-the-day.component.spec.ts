import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecOfTheDayComponent } from './rec-of-the-day.component';

describe('RecOfTheDayComponent', () => {
  let component: RecOfTheDayComponent;
  let fixture: ComponentFixture<RecOfTheDayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecOfTheDayComponent]
    });
    fixture = TestBed.createComponent(RecOfTheDayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
