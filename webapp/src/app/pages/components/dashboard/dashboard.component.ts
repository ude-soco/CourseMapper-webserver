import { CourseService } from 'src/app/services/course.service';
import { IndicatorService } from './../../../services/indicator.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { iframeValidator } from '../../../validators/iframe.validators';
import { parse } from 'angular-html-parser';
import { Course } from 'src/app/models/Course';
import { Indicator } from 'src/app/models/Indicator';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [MessageService],
})
export class DashboardComponent implements OnInit {
  indicatorForm: FormGroup;
  indicators: Indicator[] = [];
  selectedCourse: Course;
  private iframeTextarea: ElementRef;
  private mouseClick: { x: number; y: number; left: number; top: number };

  @ViewChild('iframeTextarea') set IframeTextarea(elem: ElementRef) {
    this.iframeTextarea = elem;
    this.focusOnIframeTextarea();
  }

  focusOnIframeTextarea() {
    if (this.iframeTextarea) this.iframeTextarea.nativeElement.focus();
  }

  constructor(
    private indicatorService: IndicatorService,
    private courseService: CourseService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.selectedCourse = this.courseService.getSelectedCourse();
    this.courseService.onSelectCourse.subscribe((course) => {
      this.selectedCourse = course;
      this.focusOnIframeTextarea();
      this.getIndicators();
    });

    this.indicatorForm = new FormGroup({
      indicatorIframe: new FormControl(null, iframeValidator()),
    });
  }

  getIndicators() {
    this.indicatorService.fetchIndicators().subscribe((indicators) => {
      this.indicators = indicators;
    });
    this.indicatorService.onUpdateIndicators$.subscribe(
      (indicators) => (this.indicators = indicators)
    );
  }

  onAddIndicator() {
    const neededAttributes = ['src', 'width', 'height', 'frameborder'];
    let newIndicator = {};
    if (this.indicatorForm.valid) {
      const { rootNodes, errors } = parse(
        this.indicatorForm.value.indicatorIframe
      );

      rootNodes.forEach((node) => {
        if (node['name'] === 'iframe') {
          node['attrs'].forEach((attr) => {
            if (neededAttributes.includes(attr['name'])) {
              newIndicator[attr['name']] = attr['value'];
            }
          });
        }
      });
      this.clearFormInput();
    }
    this.indicatorService
      .addNewIndicator(newIndicator)
      .subscribe((res: any) => {
        if ('success' in res) {
          this.showInfo(res.success);
        } else {
          this.showError(res.errorMsg);
        }
      });
  }

  showInfo(msg) {
    this.messageService.add({
      severity: 'info',
      summary: 'Success',
      detail: msg,
    });
  }
  showError(msg) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: msg,
    });
  }

  onDeleteIndicator(indicator) {
    this.indicatorService
      .deleteIndicator(indicator, this.selectedCourse._id)
      .subscribe((res: any) => {
        if ('success' in res) {
          this.showInfo(res.success);
        } else {
          this.showError(res.errorMsg);
        }
      });
  }

  clearFormInput() {
    this.indicatorForm.reset();
  }

  onUpdateIndicator(event: MouseEvent, indicator: Indicator) {
    const dimensions = event['path'][0]['attributes']['style']['nodeValue'];
    indicator.width = dimensions.slice(7, dimensions.indexOf(';'));
    indicator.height = dimensions.slice(
      dimensions.lastIndexOf(':') + 2,
      dimensions.lastIndexOf(';')
    );
    this.indicatorService
      .updateIndicator(indicator, this.selectedCourse._id)
      .subscribe((res: any) => {
        if ('success' in res) {
          this.showInfo(res.success);
        } else {
          this.showError(res.errorMsg);
        }
      });
  }
}
