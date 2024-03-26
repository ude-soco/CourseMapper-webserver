import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisOptionsComponent } from './vis-options.component';

describe('VisOptionsComponent', () => {
  let component: VisOptionsComponent;
  let fixture: ComponentFixture<VisOptionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VisOptionsComponent]
    });
    fixture = TestBed.createComponent(VisOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
