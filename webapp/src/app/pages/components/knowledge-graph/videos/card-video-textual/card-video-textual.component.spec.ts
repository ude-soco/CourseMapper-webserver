import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardVideoComponentTextual } from './card-video-textual.component';

describe('CardVideoComponentTextual', () => {
  let component: CardVideoComponentTextual;
  let fixture: ComponentFixture<CardVideoComponentTextual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardVideoComponentTextual ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardVideoComponentTextual);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
