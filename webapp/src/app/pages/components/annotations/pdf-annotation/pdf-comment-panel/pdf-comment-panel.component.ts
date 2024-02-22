import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import {
  Annotation,
  PdfAnnotationTool,
  PdfGeneralAnnotationLocation,
  PdfToolType,
  VideoAnnotationLocation,
} from 'src/app/models/Annotations';
import { Store } from '@ngrx/store';
import { computeElapsedTime, getInitials } from 'src/app/_helpers/format';
import * as VideoActions from '../../video-annotation/state/video.action';
import {
  getAnnotationsForMaterial,
  getCurrentPdfPage,
  State,
} from '../state/annotation.reducer';
import { SelectItemGroup } from 'primeng/api';
import { Material } from 'src/app/models/Material';
import { getCurrentMaterial } from '../../../materials/state/materials.reducer';
import { getCurrentTime } from '../../video-annotation/state/video.reducer';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import * as NotificationActions from '../../../notifications/state/notifications.actions';
import {
  getCurrentlyClickedNotification,
  getCurrentlySelectedFollowingAnnotationId,
} from '../../../notifications/state/notifications.reducer';
import { combineLatest, filter, withLatestFrom } from 'rxjs';
import { Router } from '@angular/router';
@Component({
  selector: 'app-pdf-comment-panel',
  templateUrl: './pdf-comment-panel.component.html',
  styleUrls: ['./pdf-comment-panel.component.css'],
})
export class PdfCommentPanelComponent implements OnInit, OnDestroy {
  annotations: Annotation[] = [];
  searchFiltersForPDF: SelectItemGroup[];
  searchFiltersForVideo: SelectItemGroup[];
  selectedFiltersForPDF: number[];
  selectedFiltersForVideo: number[];
  currentPage: number;
  annotationOnCurrentPage: Annotation[];
  annotationsToShow: Annotation[];
  selectedMaterial: Material;
  disableSortFilters: boolean = false;
  currentTime: number = 0;
  currentTimeSpanSelected: boolean = false;
  followingAnnotationSubscription;
  pdfPageSubscription;
  videoSeekSubscription: any;
  currentTimeSubscription: any;
  constructor(
    private store: Store<State>,
    private changeDetectorRef: ChangeDetectorRef,
    protected router: Router
  ) {
    this.store
      .select(getCurrentMaterial)
      .subscribe((material) => (this.selectedMaterial = material));

    this.store.select(getAnnotationsForMaterial).subscribe((annotations) => {
      this.annotations = annotations;
      if (this.selectedMaterial.type === 'pdf') {
        this.updateFilterItemsforPDF();
        this.showPDFAnnotations();
      } else {
        this.updateFilterItemsforVideo();
        this.showVideoAnnotations();
      }
    });

    this.pdfPageSubscription = this.store
      .select(getCurrentPdfPage)
      .subscribe((page) => {
        this.currentPage = page;
        this.selectedFiltersForPDF = null;
        this.showPDFAnnotations();
      });

    this.currentTimeSubscription = this.store
      .select(getCurrentTime)
      .subscribe((time) => {
        this.currentTime = time;
        if (
          this.selectedMaterial.type === 'video' &&
          this.currentTimeSpanSelected
        ) {
          this.annotationsToShow = this.annotations.filter(
            (a) =>
              (a.location as VideoAnnotationLocation).from <= time &&
              (a.location as VideoAnnotationLocation).to > time
          );
        }
      });
  }
  ngOnDestroy(): void {
    if (this.followingAnnotationSubscription) {
      this.followingAnnotationSubscription.unsubscribe();
    }
    if (this.pdfPageSubscription) {
      this.pdfPageSubscription.unsubscribe();
    }
    if (this.videoSeekSubscription) {
      this.videoSeekSubscription.unsubscribe();
    }
    this.currentTimeSubscription?.unsubscribe();
  }

  ngAfterViewChecked(): void {
    let annotationPanel = document.getElementsByClassName(
      'materialContainer'
    )[0] as HTMLElement;
    let commentPanel = document.getElementsByClassName(
      'commentPanel'
    )[0] as HTMLElement;
    let createAnnotationPanel = document.getElementsByClassName(
      'create-annotation'
    )[0] as HTMLElement;
    let filterPanel = document.getElementsByClassName(
      'filter-panel'
    )[0] as HTMLElement;
    if (
      annotationPanel &&
      commentPanel &&
      createAnnotationPanel &&
      filterPanel
    ) {
      commentPanel.style.maxHeight =
        annotationPanel.clientHeight -
        (createAnnotationPanel.clientHeight + filterPanel.clientHeight + 60) +
        'px';
      commentPanel.style.overflow = 'auto';
      this.changeDetectorRef.detectChanges();
    }
  }

  ngOnInit(): void {
    /* this.currentPage = 1; */
    this.showPDFAnnotations();
    /*    this.store
      .select(getCurrentlySelectedFollowingAnnotationId)
      .pipe(withLatestFrom(this.store.select(getAnnotationsForMaterial))) */
    this.followingAnnotationSubscription = combineLatest([
      this.store.select(getCurrentlySelectedFollowingAnnotationId),
      this.store.select(getAnnotationsForMaterial),
    ])
      .pipe(
        filter(
          ([id, annotations]) =>
            !!id && !!annotations && annotations.some((a) => a._id === id)
        )
      )
      .subscribe(([id, annotations]) => {
        if (id && annotations) {
          const annotation = annotations.find((a) => a._id === id);
          if (annotation) {
            if (
              (annotation.location as PdfGeneralAnnotationLocation).startPage
            ) {
              let location =
                annotation.location as PdfGeneralAnnotationLocation;
              if (location && location.startPage !== undefined) {
                this.store.dispatch(
                  AnnotationActions.setCurrentPdfPage({
                    pdfCurrentPage: location.startPage,
                  })
                );
              }
              if (
                this.router.url.includes(
                  '/course/' +
                    annotation.courseId +
                    '/channel/' +
                    annotation.channelId +
                    '/material/' +
                    '(material:' +
                    annotation.materialId +
                    `/pdf)#annotation-${annotation._id})`
                )
              ) {
                this.store.dispatch(
                  NotificationActions.unsetCurrentlySelectedFollowingAnnotation()
                );
              }
            } else if ((annotation.location as VideoAnnotationLocation).from) {
              let location = annotation.location as VideoAnnotationLocation;
              if (location && location.from !== undefined) {
                this.store.dispatch(
                  VideoActions.SetSeekVideo({
                    seekVideo: [location.from, location.from],
                  })
                );
                this.store.dispatch(
                  VideoActions.SetCurrentTime({
                    currentTime: location.from,
                  })
                );
                if (
                  this.router.url.includes(
                    '/course/' +
                      annotation.courseId +
                      '/channel/' +
                      annotation.channelId +
                      '/material/' +
                      '(material:' +
                      annotation.materialId +
                      `/video)#annotation-${annotation._id})`
                  )
                ) {
                  this.store.dispatch(
                    NotificationActions.unsetCurrentlySelectedFollowingAnnotation()
                  );
                }
              }
            }
          }
        }
      });
  }

  showPDFAnnotations() {
    this.annotationOnCurrentPage = this.annotations.filter(
      (anno) =>
        this.currentPage >=
          (anno.location as PdfGeneralAnnotationLocation).startPage &&
        this.currentPage <=
          (anno.location as PdfGeneralAnnotationLocation).lastPage
    );
    this.annotationsToShow = this.annotationOnCurrentPage;
  }

  showVideoAnnotations() {
    this.annotationsToShow = this.annotations;
  }

  onPDFAnnotationFiltersChange(filters: number[]) {
    if ([7, 8, 9, 10].some((num) => filters.includes(num))) {
      this.disableSortFilters = true;
      this.updateFilterItemsforPDF();
      this.filterAnnotationsForPDF(filters);
    } else {
      this.disableSortFilters = false;
      this.updateFilterItemsforPDF();
      this.filterAnnotationsForPDF(filters);
    }
  }

  onVideoAnnotationFiltersChange(filters: number[]) {
    if ([7, 8, 9, 10].some((num) => filters.includes(num))) {
      this.disableSortFilters = true;
      this.updateFilterItemsforVideo();
      this.filterAnnotationsForVideo(filters);
    } else {
      this.disableSortFilters = false;
      this.updateFilterItemsforVideo();
      this.filterAnnotationsForVideo(filters);
    }
  }

  filterAnnotationsForPDF(filters: number[]) {
    let filteredAnnotations: Annotation[] = [];
    let annotationOnCurrentPage = this.annotations.filter(
      (anno) =>
        (anno.location as PdfGeneralAnnotationLocation).startPage ==
        this.currentPage
    );
    let allAnnotations = this.annotations;
    let annotationsToFilter: Annotation[] = [];
    if (filters.includes(6)) {
      annotationsToFilter = allAnnotations;
      this.store.dispatch(
        AnnotationActions.setshowAllPDFAnnotations({
          showAllPDFAnnotations: true,
        })
      );
    } else {
      annotationsToFilter = annotationOnCurrentPage;
      this.store.dispatch(
        AnnotationActions.setshowAllPDFAnnotations({
          showAllPDFAnnotations: false,
        })
      );
    }

    if (filters.length > 0) {
      let annotationPerTool: Annotation[];
      let annotationPerType: Annotation[];
      let sortedAnnotations: Annotation[];

      if ([0, 1, 2, 11].some((num) => filters.includes(num))) {
        annotationPerTool = this.filterPDFAnnotationsPerTool(
          filters,
          annotationsToFilter
        );
      } else {
        annotationPerTool = null;
      }

      if ([3, 4, 5].some((num) => filters.includes(num))) {
        annotationPerType = this.filterAnnotationsPerType(
          filters,
          annotationsToFilter
        );
      } else {
        annotationPerType = null;
      }

      let intersectedArray = this.intersectionBetweenToolandType(
        annotationPerTool,
        annotationPerType
      );

      if ([6, 7, 8, 9, 10].some((num) => filters.includes(num))) {
        if (intersectedArray) {
          sortedAnnotations = this.sortAnnotations(filters, intersectedArray);
        } else {
          sortedAnnotations = this.sortAnnotations(
            filters,
            annotationsToFilter
          );
        }
        filteredAnnotations = sortedAnnotations;
      } else {
        filteredAnnotations = intersectedArray;
      }
      this.annotationsToShow = filteredAnnotations;
    } else {
      this.showPDFAnnotations();
    }
  }

  filterAnnotationsForVideo(filters: number[]) {
    let filteredAnnotations: Annotation[] = [];
    let allAnnotations = this.annotations;
    let annotationsToFilter: Annotation[] = [];

    if (filters.includes(6)) {
      this.annotationsToShow = this.annotations.filter(
        (a) =>
          (a.location as VideoAnnotationLocation).from <= this.currentTime &&
          (a.location as VideoAnnotationLocation).to > this.currentTime
      );
      this.currentTimeSpanSelected = true;
      return;
    } else {
      annotationsToFilter = allAnnotations;
    }

    if (filters.length > 0) {
      let annotationPerTool: Annotation[];
      let annotationPerType: Annotation[];
      let sortedAnnotations: Annotation[];

      if ([0, 1, 2].some((num) => filters.includes(num))) {
        annotationPerTool = this.filterVideoAnnotationsPerTool(
          filters,
          annotationsToFilter
        );
      } else {
        annotationPerTool = null;
      }

      if ([3, 4, 5].some((num) => filters.includes(num))) {
        annotationPerType = this.filterAnnotationsPerType(
          filters,
          annotationsToFilter
        );
      } else {
        annotationPerType = null;
      }

      let intersectedArray = this.intersectionBetweenToolandType(
        annotationPerTool,
        annotationPerType
      );

      if ([6, 7, 8, 9, 10].some((num) => filters.includes(num))) {
        if (intersectedArray) {
          sortedAnnotations = this.sortAnnotations(filters, intersectedArray);
        } else {
          sortedAnnotations = this.sortAnnotations(
            filters,
            annotationsToFilter
          );
        }
        filteredAnnotations = sortedAnnotations;
      } else {
        filteredAnnotations = intersectedArray;
      }
      this.annotationsToShow = filteredAnnotations;
    } else {
      this.currentTimeSpanSelected = false;
      this.showVideoAnnotations();
    }
  }

  filterPDFAnnotationsPerTool(
    filters: number[],
    annotations: Annotation[]
  ): Annotation[] {
    let annotationsFilteredWithTool: Annotation[] = [];
    filters.forEach((filter) => {
      switch (filter) {
        case 0: // Drawing tool
          annotationsFilteredWithTool.push(
            ...annotations.filter((a) => a.tool.type === PdfToolType.DrawBox)
          );
          break;
        case 1: // Pinpoint tool
          annotationsFilteredWithTool.push(
            ...annotations.filter((a) => a.tool.type === PdfToolType.Pin)
          );
          break;
        case 2: // Highlight tool
          annotationsFilteredWithTool.push(
            ...annotations.filter((a) => a.tool.type === PdfToolType.Highlight)
          );
          break;
        case 11: // Without tool
          annotationsFilteredWithTool.push(
            ...annotations.filter((a) => a.tool.type === PdfToolType.Annotation)
          );
          break;
        default:
          break;
      }
    });
    return annotationsFilteredWithTool;
  }

  filterVideoAnnotationsPerTool(
    filters: number[],
    annotations: Annotation[]
  ): Annotation[] {
    let annotationsFilteredWithTool: Annotation[] = [];
    filters.forEach((filter) => {
      switch (filter) {
        case 0: // Drawing tool
          annotationsFilteredWithTool.push(
            ...annotations.filter((a) => a.tool.type === 'brush')
          );
          break;
        case 1: // Pinpoint tool
          annotationsFilteredWithTool.push(
            ...annotations.filter((a) => a.tool.type === 'pin')
          );
          break;
        case 2: // Annotation tool
          annotationsFilteredWithTool.push(
            ...annotations.filter((a) => a.tool.type === 'annotation')
          );
          break;
        default:
          break;
      }
    });
    return annotationsFilteredWithTool;
  }

  filterAnnotationsPerType(
    filters: number[],
    annotations: Annotation[]
  ): Annotation[] {
    let annotationsFilteredWithType: Annotation[] = [];
    filters.forEach((filter) => {
      switch (filter) {
        case 3: // Note type
          annotationsFilteredWithType.push(
            ...annotations.filter((a) => a.type === 'Note')
          );
          break;
        case 4: // Question type
          annotationsFilteredWithType.push(
            ...annotations.filter((a) => a.type === 'Question')
          );
          break;
        case 5: // External Resource type
          annotationsFilteredWithType.push(
            ...annotations.filter((a) => a.type === 'External Resource')
          );
          break;
        default:
          break;
      }
    });
    return annotationsFilteredWithType;
  }

  intersectionBetweenToolandType(
    annotationPerTool: Annotation[],
    annotationPerType: Annotation[]
  ): Annotation[] {
    if (annotationPerTool && !annotationPerType) {
      return annotationPerTool;
    } else if (!annotationPerTool && annotationPerType) {
      return annotationPerType;
    } else if (!annotationPerTool && !annotationPerType) {
      return null;
    } else {
      const intersectedAnnotations = annotationPerType.filter(
        (secondElement) => {
          return annotationPerTool.some(
            (firstElement) => firstElement._id === secondElement._id
          );
        }
      );
      return intersectedAnnotations;
    }
  }

  sortAnnotations(filters: number[], annotations: Annotation[]): Annotation[] {
    let sortedAnnotations: Annotation[] = [];
    filters.forEach((filter) => {
      switch (filter) {
        case 7: // Date (Oldest To Newest) sort
          sortedAnnotations = annotations
            .slice()
            .sort(
              (b, a) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
          break;
        case 8: // Date (Newest To Oldest) sort
          sortedAnnotations = annotations
            .slice()
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
          break;
        case 9: // By User Name (A-Z) sort
          sortedAnnotations = annotations
            .slice()
            .sort((a, b) =>
              a.author?.name
                ?.toLowerCase()
                .localeCompare(b.author?.name.toLowerCase())
            );
          break;
        case 10: // By User Name (Z-A) sort
          sortedAnnotations = annotations
            .slice()
            .sort((a, b) =>
              b.author?.name
                ?.toLowerCase()
                .localeCompare(a.author?.name.toLowerCase())
            );
          break;
        default:
          sortedAnnotations = annotations;
          break;
      }
    });
    return sortedAnnotations;
  }

  updateFilterItemsforPDF() {
    this.searchFiltersForPDF = [
      {
        label: 'Annotation Tools',
        value: 'tool',
        items: [
          { label: 'Drawing', value: 0 },
          { label: 'Pinpoint', value: 1 },
          { label: 'Highlight', value: 2 },
          { label: 'Without Tool', value: 11 },
        ],
      },
      {
        label: 'Annotation Types',
        value: 'type',
        items: [
          { label: 'Note', value: 3 },
          { label: 'Question', value: 4 },
          { label: 'External Resource', value: 5 },
        ],
      },
      {
        label: 'Show All',
        value: 'all',
        items: [{ label: 'Show All Annotations', value: 6 }],
      },
      {
        label: 'Sort By',
        value: 'sort',
        items: [
          {
            label: 'Date (Oldest To Newest)',
            value: 7,
            disabled: this.disableSortFilters,
          },
          {
            label: 'Date (Newest To Oldest)',
            value: 8,
            disabled: this.disableSortFilters,
          },
          {
            label: 'By User Name (A-Z)',
            value: 9,
            disabled: this.disableSortFilters,
          },
          {
            label: 'By User Name (Z-A)',
            value: 10,
            disabled: this.disableSortFilters,
          },
        ],
      },
    ];
  }

  updateFilterItemsforVideo() {
    this.searchFiltersForVideo = [
      {
        label: 'Annotation Tools',
        value: 'tool',
        items: [
          { label: 'Drawing', value: 0 },
          { label: 'Pinpoint', value: 1 },
          { label: 'Without Tool', value: 2 },
        ],
      },
      {
        label: 'Annotation Types',
        value: 'type',
        items: [
          { label: 'Note', value: 3 },
          { label: 'Question', value: 4 },
          { label: 'External Resource', value: 5 },
        ],
      },
      {
        label: 'Show All',
        value: 'all',
        items: [{ label: 'Current Time Span', value: 6 }],
      },
      {
        label: 'Sort By',
        value: 'sort',
        items: [
          {
            label: 'Date (Oldest To Newest)',
            value: 7,
            disabled: this.disableSortFilters,
          },
          {
            label: 'Date (Newest To Oldest)',
            value: 8,
            disabled: this.disableSortFilters,
          },
          {
            label: 'By User Name (A-Z)',
            value: 9,
            disabled: this.disableSortFilters,
          },
          {
            label: 'By User Name (Z-A)',
            value: 10,
            disabled: this.disableSortFilters,
          },
        ],
      },
    ];
  }
}
