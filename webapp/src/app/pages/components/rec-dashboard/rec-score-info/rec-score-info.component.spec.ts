import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecScoreInfoComponent } from './rec-score-info.component';

describe('RecScoreInfoComponent', () => {
  let component: RecScoreInfoComponent;
  let fixture: ComponentFixture<RecScoreInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecScoreInfoComponent]
    });
    fixture = TestBed.createComponent(RecScoreInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
