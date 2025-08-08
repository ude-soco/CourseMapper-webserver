import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyphrasePopupComponent } from './keyphrase-popup.component';

describe('KeyphrasePopupComponent', () => {
  let component: KeyphrasePopupComponent;
  let fixture: ComponentFixture<KeyphrasePopupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KeyphrasePopupComponent]
    });
    fixture = TestBed.createComponent(KeyphrasePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
