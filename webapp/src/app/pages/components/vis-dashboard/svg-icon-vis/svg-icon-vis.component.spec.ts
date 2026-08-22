import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SvgIconVisComponent } from './svg-icon-vis.component';

describe('SvgIconVisComponent', () => {
  let component: SvgIconVisComponent;
  let fixture: ComponentFixture<SvgIconVisComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SvgIconVisComponent]
    });
    fixture = TestBed.createComponent(SvgIconVisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
