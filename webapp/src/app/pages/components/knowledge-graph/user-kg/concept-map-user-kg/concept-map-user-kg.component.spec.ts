import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConceptMapUserKgComponent } from './concept-map-user-kg.component';

describe('ConceptMapUserKgComponent', () => {
  let component: ConceptMapUserKgComponent;
  let fixture: ComponentFixture<ConceptMapUserKgComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConceptMapUserKgComponent]
    });
    fixture = TestBed.createComponent(ConceptMapUserKgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
