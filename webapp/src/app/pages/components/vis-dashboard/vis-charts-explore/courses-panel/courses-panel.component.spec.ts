import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoursesPanelComponent } from './courses-panel.component';

describe('CoursesPanelComponent', () => {
  let component: CoursesPanelComponent;
  let fixture: ComponentFixture<CoursesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CoursesPanelComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CoursesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
