import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardArticleListComponentTextual } from './card-article-list-textual.component';

describe('CardArticleListComponentTextual', () => {
  let component: CardArticleListComponentTextual;
  let fixture: ComponentFixture<CardArticleListComponentTextual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardArticleListComponentTextual ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardArticleListComponentTextual);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
