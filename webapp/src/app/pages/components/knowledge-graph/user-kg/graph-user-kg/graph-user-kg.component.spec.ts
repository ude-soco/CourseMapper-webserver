import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphUserKgComponent } from './graph-user-kg.component';

describe('GraphUserKgComponent', () => {
  let component: GraphUserKgComponent;
  let fixture: ComponentFixture<GraphUserKgComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GraphUserKgComponent]
    });
    fixture = TestBed.createComponent(GraphUserKgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
