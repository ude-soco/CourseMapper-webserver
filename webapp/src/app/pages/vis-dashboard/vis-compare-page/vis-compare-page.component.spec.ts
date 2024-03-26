import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisComparePageComponent } from './vis-compare-page.component';

describe('VisComparePageComponent', () => {
  let component: VisComparePageComponent;
  let fixture: ComponentFixture<VisComparePageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VisComparePageComponent]
    });
    fixture = TestBed.createComponent(VisComparePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
