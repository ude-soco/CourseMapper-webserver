import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
  Annotation,
  AnnotationType,
  PdfGeneralAnnotationLocation,
  PdfToolType,
} from 'src/app/models/Annotations';
import {
  getAnnotationProperties,
  getCreateAnnotationFromPanel,
  getCurrentPdfPage,
  getIsAnnotationDialogVisible,
  getPdfTotalNumberOfPages,
  State,
} from '../state/annotation.reducer';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import { Observable } from 'rxjs';
import { getCurrentMaterialId } from '../../../materials/state/materials.reducer';
import { getCurrentCourseId } from 'src/app/pages/courses/state/course.reducer';
import { MentionsComponent } from '../../../../../components/mentions/mentions.component';
import { NotificationsService } from 'src/app/services/notifications.service';

@Component({
  selector: 'app-pdf-create-annotation',
  templateUrl: './pdf-create-annotation.component.html',
  styleUrls: ['./pdf-create-annotation.component.css'],
})
export class PdfCreateAnnotationComponent
  extends MentionsComponent
  implements OnInit, AfterViewChecked, OnDestroy
{
  selectedAnnotationType: AnnotationType;
  annotationTypesArray: string[];
  annotationLocationsArray: string[];
  selectedAnnotationLocation: string;
  createAnnotationFromPanel: boolean;
  showCancelButton: boolean = false;
  disableSlidesDropDown: boolean = false;
  annotation: Annotation;
  materialId: string;
  postAnnotationLocation: PdfGeneralAnnotationLocation;
  currentPage: number;
  totalPages: number;
  isFromSelected: boolean = false;
  fromPageArray: number[];
  toPageArray: number[];
  selectedFromPage: number;
  selectedToPage: number;
  annotationColor: string = '#0000004D';
  sendButtonColor: string = 'text-green-600';
  showCancelButton$: Observable<boolean>;
  sendButtonDisabled: boolean = true;
  currentPdfPageSubscription: any;

  constructor(
    override store: Store<State>,
    override notificationService: NotificationsService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    super(store, notificationService);
  }
  ngOnDestroy(): void {
    if (this.currentPdfPageSubscription) {
      this.currentPdfPageSubscription.unsubscribe();
    }
  }
  ngAfterViewChecked(): void {
    this.changeDetectorRef.detectChanges();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.annotationTypesArray = ['Note', 'Question', 'External Resource'];
    this.annotationLocationsArray = [
      'Current Slide',
      'All Slides',
      'Slide Range',
    ];

    this.store.select(getCreateAnnotationFromPanel).subscribe((isFromPanel) => {
      if (isFromPanel) {
        this.createAnnotationFromPanel = isFromPanel;
        this.showCancelButton = false;
        this.disableSlidesDropDown = false;
      } else {
        this.showCancelButton = true;
        this.disableSlidesDropDown = true;
      }
    });

    this.showCancelButton$ = this.store.select(getIsAnnotationDialogVisible);

    this.store.select(getAnnotationProperties).subscribe((_annotation) => {
      this.annotation = _annotation;
    });
    this.store.select(getCurrentCourseId).subscribe((id) => {
      this.courseId = id;
    });

    this.store.select(getCurrentMaterialId).subscribe((id) => {
      this.materialId = id;
    });

    this.currentPdfPageSubscription = this.store
      .select(getCurrentPdfPage)
      .subscribe((page) => {
        this.currentPage = page;
      });

    this.store.select(getPdfTotalNumberOfPages).subscribe((total) => {
      this.totalPages = total;
      this.fromPageArray = Array.from(
        { length: this.totalPages },
        (_, i) => i + 1
      );
      this.selectedFromPage = 1;
      this.toPageArray = Array.from(
        { length: this.totalPages - this.selectedFromPage + 1 },
        (_, i) => i + this.selectedFromPage
      );
      this.selectedToPage = 1;
    });
    this.selectedAnnotationType = 'Note';
    this.selectedAnnotationLocation = 'Current Slide';
    this.annotationColor = '#70b85e';
  }

  postAnnotation() {
    if (this.createAnnotationFromPanel) {
      this.annotation = null;
      switch (this.selectedAnnotationLocation) {
        case 'Current Slide':
          this.annotation = {
            type: this.selectedAnnotationType,
            content: this.content,
            courseId: this.courseId,
            materialId: this.materialId,
            location: {
              type: this.selectedAnnotationLocation,
              startPage: this.currentPage,
              lastPage: this.currentPage,
            },
            tool: {
              type: PdfToolType.Annotation,
              _id: '',
            },
          };
          this.dispatchAnnotation();
          this.selectedAnnotationLocation = null;
          this.selectedAnnotationType = null;
          this.content = null;
          break;

        case 'All Slides':
          this.annotation = {
            type: this.selectedAnnotationType,
            content: this.content,
            courseId: this.courseId,
            materialId: this.materialId,
            location: {
              type: this.selectedAnnotationLocation,
              startPage: 1,
              lastPage: this.totalPages,
            },
            tool: {
              type: PdfToolType.Annotation,
              _id: '',
            },
          };
          this.dispatchAnnotation();
          this.selectedAnnotationLocation = null;
          this.selectedAnnotationType = null;
          this.content = null;
          break;

        case 'Slide Range':
          this.annotation = {
            type: this.selectedAnnotationType,
            content: this.content,
            courseId: this.courseId,
            materialId: this.materialId,
            location: {
              type: this.selectedAnnotationLocation,
              startPage: this.selectedFromPage,
              lastPage: this.selectedToPage,
            },
            tool: {
              type: PdfToolType.Annotation,
              _id: '',
            },
          };
          this.dispatchAnnotation();
          this.selectedAnnotationLocation = null;
          this.selectedAnnotationType = null;
          this.content = null;
          break;
      }
    } else {
      this.annotation = {
        ...this.annotation,
        type: this.selectedAnnotationType,
        content: this.content,
        location: {
          type: 'Current Slide',
          startPage: this.currentPage,
          lastPage: this.currentPage,
        },
      };

      this.dispatchAnnotation();
    }
  }

  dispatchAnnotation() {
   
    this.removeRepeatedUsersFromMentionsArray();
    this.store.dispatch(
      AnnotationActions.postAnnotation({
        annotation: this.annotation,
        mentionedUsers: this.mentionedUsers,
      })
    );
    this.content = null;
    this.mentionedUsers = [];

    this.sendButtonDisabled = true;
  }

  onSelectedFromPage() {
    if (this.selectedFromPage === null) {
      this.isFromSelected = false;
    } else {
      this.toPageArray = Array.from(
        { length: this.totalPages - this.selectedFromPage + 1 },
        (_, i) => i + this.selectedFromPage
      );
      this.isFromSelected = true;
    }
  }

  onShowOfSelectedFromPageDropDpown() {
    this.toPageArray = Array.from(
      { length: this.totalPages - this.selectedFromPage + 1 },
      (_, i) => i + this.selectedFromPage
    );
    this.isFromSelected = true;
  }

  onTextChange() {
    if (this.content.replace(/<\/?[^>]+(>|$)/g, '') == '') {
      this.sendButtonDisabled = true;
    } else {
      this.sendButtonDisabled = false;
    }
  }

  cancel() {
    this.store.dispatch(
      AnnotationActions.setIsAnnotationCanceled({ isAnnotationCanceled: true })
    );
  }

  onAnnotationTypeChange() {
    switch (this.selectedAnnotationType) {
      case 'Note':
        this.annotationColor = '#70b85e';
        this.sendButtonColor = 'text-green-600';
        break;
      case 'Question':
        this.annotationColor = '#FFAB5E';
        this.sendButtonColor = 'text-amber-500';
        break;
      case 'External Resource':
        this.annotationColor = '#B85E94';
        this.sendButtonColor = 'text-pink-700';
        break;
      case null:
        this.annotationColor = '#70b85e';
        this.sendButtonColor = 'text-green-600';
        break;
    }
  }
}
