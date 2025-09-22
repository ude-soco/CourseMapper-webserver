import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardArticleComponentVisual } from './card-article-visual.component';

describe('CardArticleComponentVisual', () => {
  let component: CardArticleComponentVisual;
  let fixture: ComponentFixture<CardArticleComponentVisual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardArticleComponentVisual ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardArticleComponentVisual);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
