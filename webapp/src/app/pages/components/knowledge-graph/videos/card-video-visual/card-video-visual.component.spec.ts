import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardVideoComponentVisual } from './card-video-visual.component';

describe('CardVideoComponentVisual', () => {
  let component: CardVideoComponentVisual;
  let fixture: ComponentFixture<CardVideoComponentVisual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardVideoComponentVisual ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardVideoComponentVisual);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
