import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationSettingItemPanelComponent } from './notification-setting-item-panel.component';

describe('NotificationSettingItemPanelComponent', () => {
  let component: NotificationSettingItemPanelComponent;
  let fixture: ComponentFixture<NotificationSettingItemPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NotificationSettingItemPanelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationSettingItemPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
