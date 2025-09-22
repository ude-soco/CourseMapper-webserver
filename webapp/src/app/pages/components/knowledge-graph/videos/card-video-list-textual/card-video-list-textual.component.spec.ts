import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardVideoListComponentTextual } from './card-video-list-textual.component';

describe('CardVideoListComponentTextual', () => {
  let component: CardVideoListComponentTextual;
  let fixture: ComponentFixture<CardVideoListComponentTextual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardVideoListComponentTextual ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardVideoListComponentTextual);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
