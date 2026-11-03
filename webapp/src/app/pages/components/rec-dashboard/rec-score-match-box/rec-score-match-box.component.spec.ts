import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecScoreMatchBoxComponent } from './rec-score-match-box.component';

describe('RecScoreMatchBoxComponent', () => {
  let component: RecScoreMatchBoxComponent;
  let fixture: ComponentFixture<RecScoreMatchBoxComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecScoreMatchBoxComponent]
    });
    fixture = TestBed.createComponent(RecScoreMatchBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
