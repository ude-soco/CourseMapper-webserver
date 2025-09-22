import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardArticleComponentTextual } from './card-article-textual.component';


describe('CardArticleComponentTextual', () => {
  let component: CardArticleComponentTextual;
  let fixture: ComponentFixture<CardArticleComponentTextual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardArticleComponentTextual ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardArticleComponentTextual);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
