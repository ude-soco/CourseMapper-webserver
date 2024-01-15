import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardArticleComponent } from './card-article.component';

describe('CardArticleComponent', () => {
  let component: CardArticleComponent;
  let fixture: ComponentFixture<CardArticleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardArticleComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardArticleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
