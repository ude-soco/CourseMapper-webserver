import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CytoscapeSlideKGComponent } from './cytoscape-slide-kg.component';

describe('CytoscapeSlideKGComponent', () => {
  let component: CytoscapeSlideKGComponent;
  let fixture: ComponentFixture<CytoscapeSlideKGComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CytoscapeSlideKGComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CytoscapeSlideKGComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
