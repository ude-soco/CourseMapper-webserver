import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CytoscapeSlideComponent } from './cytoscape-slide.component';

describe('CytoscapeSlideComponent', () => {
  let component: CytoscapeSlideComponent;
  let fixture: ComponentFixture<CytoscapeSlideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CytoscapeSlideComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CytoscapeSlideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
