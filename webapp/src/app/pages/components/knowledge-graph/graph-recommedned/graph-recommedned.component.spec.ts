import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphRecommednedComponent } from './graph-recommedned.component';

describe('GraphRecommednedComponent', () => {
  let component: GraphRecommednedComponent;
  let fixture: ComponentFixture<GraphRecommednedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GraphRecommednedComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraphRecommednedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
