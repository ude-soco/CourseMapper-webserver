import { CourseService } from 'src/app/services/course.service';
import { IndicatorService } from './../../../services/indicator.service';
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {  Store } from '@ngrx/store';
import { IFrameValidators } from '../../../validators/iframe.validators';
import { parse } from 'angular-html-parser';
import { Course } from 'src/app/models/Course';
import { Indicator } from 'src/app/models/Indicator';
import { MessageService } from 'primeng/api';
import { DragulaService } from 'ng2-dragula';
import { ConfirmationService } from 'primeng/api';
import { ActivatedRoute } from '@angular/router';
import { getCurrentCourseId, State } from 'src/app/pages/courses/state/course.reducer';
import { StorageService } from 'src/app/services/storage.service';
import { ModeratorPrivilegesService } from 'src/app/services/moderator-privileges.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [MessageService, ConfirmationService],
})
export class DashboardComponent implements OnInit, OnDestroy {
  indicatorForm?: FormGroup = new FormGroup({
    indicatorIframe: new FormControl(''),
  });
  indicators: Indicator[] = [];
  selectedCourse: Course;
  private iframeTextarea: ElementRef;
  selectedCourseId: string = "";
  hasPrivileges: Boolean;
  user = this.storageService.getUser();


  @ViewChild('iframeTextarea') set IframeTextarea(elem: ElementRef) {
    this.iframeTextarea = elem;
    this.focusOnIframeTextarea();
  }

  focusOnIframeTextarea() {
    if (this.iframeTextarea) this.iframeTextarea.nativeElement.focus();
  }

  constructor(
    private store: Store<State>,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private indicatorService: IndicatorService,
    private courseService: CourseService,
    private messageService: MessageService,
    private dragulaService: DragulaService,
    private confirmationService: ConfirmationService,
    private moderatorPrivilegesService:ModeratorPrivilegesService,
  ) {
    this.moderatorPrivilegesService.subject.subscribe(hasPrivileges => {
      this.hasPrivileges = hasPrivileges
  
    })
   
    
    this.dragulaService?.createGroup('INDICATORS', {
      revertOnSpill: true,
      moves: function (el: any, container: any, handle: any): any {
        if (handle.id === 'dragger') {
          return true;
        }
        return false;
      },
    });

    this.dragulaService?.dropModel('INDICATORS').subscribe((args) => {
      this.onReorderIndicators(
        args.sourceIndex,
        args.targetIndex,
        this.selectedCourse._id
      );
    });
  }
  ngOnDestroy(): void {
    this.hasPrivileges = false;
    this.dragulaService.destroy('INDICATORS');
  }

  

  ngOnInit(): void {
    this.selectedCourse = this.courseService.getSelectedCourse();
    this.courseService.onSelectCourse.subscribe((course) => {
      this.selectedCourse = course;
    }); 
    this.focusOnIframeTextarea();
    this.getIndicators();
    this.indicatorForm = this.formBuilder.group({
      indicatorIframe: [
        null,
        [
          Validators.required,
          IFrameValidators.notOnlyWhitespace,
          IFrameValidators.iframeValidator,
        ],
      ],
    });
  }

  get indicatorIframe() {
    return this.indicatorForm?.get('indicatorIframe');
  }

  

  getIndicators() {
    this.store.select(getCurrentCourseId).subscribe((id) => {
      this.selectedCourseId = id;
    });
    this.indicatorService.fetchIndicators(this.selectedCourseId).subscribe((indicators) => {
      this.indicators = indicators;
    });
    this.indicatorService.onUpdateIndicators$.subscribe(
      (indicators) => (this.indicators = indicators)
    );
  }

  onAddIndicator() {
    if (this.indicatorForm.invalid) {
      this.indicatorForm.markAllAsTouched();
      return;
    }
    const neededAttributes = ['src', 'width', 'height', 'frameborder'];
    let newIndicator = {};

    const { rootNodes, errors } = parse(this.indicatorIframe.value);

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
    this.confirmationService.confirm({
      message: 'Are you sure that you want to delete the Indicator?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.onConfirmDeletion(indicator),
    });
  }

  onConfirmDeletion(indicator) {
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
    if (event.composedPath()[0]['attributes']['style']) {
      const dimensions =
        event.composedPath()[0]['attributes']['style']['nodeValue'];
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

  onReorderIndicators(sourceIndex, targetIndex, courseId) {
    this.indicatorService
      .reorderIndicators(sourceIndex, targetIndex, courseId)
      .subscribe((res: any) => {
        if ('success' in res) {
          this.showInfo(res.success);
        } else {
          this.showError(res.errorMsg);
        }
      });
  }
}
