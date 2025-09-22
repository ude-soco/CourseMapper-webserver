import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardArticleListComponentVisual } from './card-article-list-visual.component';

describe('CardArticleListComponentVisual', () => {
  let component: CardArticleListComponentVisual;
  let fixture: ComponentFixture<CardArticleListComponentVisual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardArticleListComponentVisual ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardArticleListComponentVisual);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
