import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardVideoListComponentVisual } from './card-video-list-visual.component';

describe('CardVideoListComponentVisual', () => {
  let component: CardVideoListComponentVisual;
  let fixture: ComponentFixture<CardVideoListComponentVisual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardVideoListComponentVisual ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardVideoListComponentVisual);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
