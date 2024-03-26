import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformTabsComponent } from './platform-tabs.component';

describe('PlatformTabsComponent', () => {
  let component: PlatformTabsComponent;
  let fixture: ComponentFixture<PlatformTabsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PlatformTabsComponent]
    });
    fixture = TestBed.createComponent(PlatformTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
