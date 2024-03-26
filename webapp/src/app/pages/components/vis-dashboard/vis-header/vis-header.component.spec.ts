import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisHeaderComponent } from './vis-header.component';

describe('VisHeaderComponent', () => {
  let component: VisHeaderComponent;
  let fixture: ComponentFixture<VisHeaderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VisHeaderComponent]
    });
    fixture = TestBed.createComponent(VisHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
