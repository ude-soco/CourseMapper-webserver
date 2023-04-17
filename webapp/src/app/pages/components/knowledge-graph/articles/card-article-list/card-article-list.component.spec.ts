import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardArticleListComponent } from './card-article-list.component';

describe('CardArticleListComponent', () => {
  let component: CardArticleListComponent;
  let fixture: ComponentFixture<CardArticleListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardArticleListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardArticleListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
