import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  Renderer2,
  HostListener,
  ChangeDetectorRef,
  AfterViewChecked,
} from '@angular/core';
import { Channel } from 'src/app/models/Channel';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { Material } from 'src/app/models/Material';
import { PdfviewService } from 'src/app/services/pdfview.service';
import { MaterilasService } from 'src/app/services/materials.service';
import {
  ActivatedRoute,
  Router,
  RouterState,
  UrlSegment,
  UrlSegmentGroup,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { State } from 'src/app/pages/components/materials/state/materials.reducer';
import * as MaterialActions from 'src/app/pages/components/materials/state/materials.actions';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import { BehaviorSubject, Observable, Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ModeratorPrivilegesService } from 'src/app/services/moderator-privileges.service';
import * as CourseActions from 'src/app/pages/courses/state/course.actions';
import { getNotificationSettingsOfLastMaterialMenuClicked } from 'src/app/pages/courses/state/course.reducer';
import {
  materialNotificationSettingLabels,
  Notification,
} from 'src/app/models/Notification';
import { getNotifications } from '../../notifications/state/notifications.reducer';
import * as NotificationActions from '../../notifications/state/notifications.actions';
import { MaterialKgOrderedService } from 'src/app/services/material-kg-ordered.service';
import { Indicator } from 'src/app/models/Indicator';
import { IndicatorService } from 'src/app/services/indicator.service';
import { CourseService } from 'src/app/services/course.service';
import { getLastTimeCourseMapperOpened } from 'src/app/state/app.reducer';
import * as VideoActions from '../../annotations/video-annotation/state/video.action';
import { IntervalService } from 'src/app/services/interval.service';

@Component({
  selector: 'app-material',
  templateUrl: './material.component.html',
  styleUrls: ['./material.component.css'],
  providers: [MessageService, ConfirmationService],
})
export class MaterialComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Output() public channelEmitted = new EventEmitter<any>();

  selectedChannel: Channel;
  channelSelected$: Observable<boolean>;
  index = 0;
  selectedMaterial?: Material;
  @Input() channel?: Channel;
  @Input() courseID?: string;
  @Input() topicID?: string;
  @Input() initialMaterial?: Material;
  @Output() materialCreated: EventEmitter<void> = new EventEmitter();

  private channels: Channel[] = [];
  materials: Material[] = [];

  showFullMap: { [key: string]: boolean } = {};
  materialType?: string;
  tabIndex: number = -1;
  isMaterialSelected: boolean = false;

  displayAddTopicDialogue: boolean = false;
  editable: boolean = false;
  escapeKey: boolean = false;
  enterKey: boolean = false;
  insertedText: string = '';
  selectedId: string = '';
  previousMaterial: Material;
  isNewMaterialModalVisible: boolean = false;
  errorMessage: any;
  showConceptMapEvent: boolean = false;
  forMaterialDashboard: boolean = false;
  materialID: string = '';
  channelID: string = '';
  routeSubscription: Subscription;
  allNotifications$: Observable<Notification[]>;
  lastTimeCourseMapperOpened$: Observable<string>;
  @Output() conceptMapEvent: EventEmitter<boolean> = new EventEmitter();
  @Output() selectedToolEvent: EventEmitter<string> = new EventEmitter();
  cmSelected = false;

  showModeratorPrivileges: boolean;
  privilegesSubscription: Subscription;
  @ViewChild('materialMenu') materialMenu: any;
  materialIdOfMaterialMenuClicked: string;
  /*   protected checkBoxesGroup = this.fb.group({});
  checkBoxesArray: { label: string; control: FormControl<boolean> }[] = []; */
  protected materialCheckBoxesGroup = this.fb.group({});
  materialCheckBoxesArray: { label: string; control: FormControl<boolean> }[] =
    [];
  notificationSettingsOfLastMaterialMenuClicked$: Observable<
    {
      label: string;
      value: boolean;
    }[]
  > = null;
  isResetMaterialNotificationsButtonEnabled: boolean;
  lastMaterialClickedNotificationSettingSubscription: Subscription;
  constructor(
    private indicatorService: IndicatorService,
    public courseService: CourseService,
    private topicChannelService: TopicChannelService,
    private pdfViewService: PdfviewService,
    private materialService: MaterilasService,
    private router: Router,
    private store: Store<State>,
    private activatedRoute: ActivatedRoute,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private moderatorPrivilegesService: ModeratorPrivilegesService,
    private renderer: Renderer2,
    private changeDetectorRef: ChangeDetectorRef,
    private materialKgService: MaterialKgOrderedService,
    protected fb: FormBuilder,

    private intervalService: IntervalService,
    private cdr: ChangeDetectorRef
  ) {
    const url = this.router.url;

    if (url.includes('course') && url.includes('channel')) {
      const courseRegex = /\/course\/(\w+)/;
      const channelRegex = /\/channel\/(\w+)/;
      const courseId = courseRegex.exec(url)[1];
      const channelId = channelRegex.exec(url)[1];
      const materialId = url.match(/material:(.*?)\/(pdf|video)/)?.[1];

      this.courseID = courseId;

      this.topicChannelService
        .getChannel(courseId, channelId)
        .subscribe((foundChannel) => {
          this.selectedChannel = foundChannel;
          this.channelID = this.selectedChannel._id;
          this.materials = foundChannel.materials;

          this.materials.forEach((material) => {
            this.showFullMap[material._id] = false;
          });

          this.channels.push(this.selectedChannel);
          this.selectedMaterial = foundChannel.materials.find(
            (material) => material._id == materialId
          );

          this.tabIndex =
            foundChannel.materials.findIndex(
              (material) => material._id == materialId
            ) + 1;
          this.store.dispatch(
            CourseActions.toggleChannelSelected({ channelSelected: true })
          );
          this.store.dispatch(
            CourseActions.SetSelectedChannel({ selectedChannel: foundChannel })
          );
          this.updateSelectedMaterial();
        });
    }
    this.showModeratorPrivileges =
      this.moderatorPrivilegesService.showModeratorPrivileges;
    this.privilegesSubscription = this.moderatorPrivilegesService
      .privilegesObserver()
      .subscribe(() => {
        this.showModeratorPrivileges =
          moderatorPrivilegesService.showModeratorPrivileges;
      });

    //attempt to refresh the component:
    this.activatedRoute.params.subscribe((params) => {
      /* this.reloadCurrentRoute(); */
    });
  }
  ngAfterViewChecked(): void {
    let inkBar = document.getElementById('material-tabview') as HTMLElement;
    let currentTab = document.getElementsByClassName(
      'p-highlight'
    )[0] as HTMLElement;
    if (inkBar && currentTab) {
      inkBar.style.width = currentTab.clientWidth + 'px';
      this.changeDetectorRef.detectChanges();
    }
  }
  ngOnDestroy(): void {
    if (this.lastMaterialClickedNotificationSettingSubscription) {
      this.lastMaterialClickedNotificationSettingSubscription.unsubscribe();
    }
  }

  ngOnInit() {
    this.topicChannelService.onSelectChannel.subscribe((channel) => {
      this.selectedChannel = channel;
      this.channelEmitted.emit(this.selectedChannel);
      this.materials = [];
      if (!this.selectedChannel?.materials) {
      } else {
        this.topicChannelService
          .getChannelDetails(this.selectedChannel)
          .subscribe({
            next: (data) => {
              this.channels = data;

              if (this.selectedChannel._id === this.channels['_id']) {
                this.materials = this.channels['materials'];
                this.materials.forEach((material) => {
                  this.showFullMap[material._id] = false;
                });
              } else {
                this.selectedChannel._id = this.channels['_id'];
              }
            },
            error: (err) => {
              this.errorMessage = err.error.message;
            },
          });
      }
    });
    this.showModeratorPrivileges =
      this.moderatorPrivilegesService.showModeratorPrivileges;

    this.selectedToolEvent.emit('none');

    this.notificationSettingsOfLastMaterialMenuClicked$ = this.store.select(
      getNotificationSettingsOfLastMaterialMenuClicked
    );

    this.lastMaterialClickedNotificationSettingSubscription =
      this.notificationSettingsOfLastMaterialMenuClicked$.subscribe(
        (notificationSettings) => {
          if (!notificationSettings) return;
          //delete all the controls in the form Group
          this.materialCheckBoxesGroup = this.fb.group({});
          this.materialCheckBoxesArray = [];
          notificationSettings.forEach((o, index) => {
            if (index === 0) {
              this.isResetMaterialNotificationsButtonEnabled = o.value;
              return;
            }
            const control = new FormControl<boolean>(o.value);
            this.materialCheckBoxesArray.push({
              label: o.label,
              control: control,
            });
            this.materialCheckBoxesGroup.addControl(o.label, control);
          });
        }
      );
    const routerState: RouterState =
      this.activatedRoute.snapshot['_routerState'];
    const url = routerState['url'];
    // Check if the outlet information is present
    const outletInfoActive = url.includes('material:');
    if (outletInfoActive) {
      this.isMaterialSelected = true;
    } else {
      this.isMaterialSelected = false;
    }

    this.allNotifications$ = this.store.select(getNotifications);

    this.lastTimeCourseMapperOpened$ = this.store.select(
      getLastTimeCourseMapperOpened
    );
  }
  toggleFullMaterialName(materialId: string, event: MouseEvent): void {
    // event.preventDefault();
    event.stopPropagation();
    // Toggle the state for the specific material's full name
    if (this.showFullMap.hasOwnProperty(materialId)) {
      this.showFullMap[materialId] = !this.showFullMap[materialId];
    } else {
      this.showFullMap[materialId] = true;
    }
    // this.showFullMap[materialId] = !this.showFullMap[materialId];
    // Trigger change detection to update the view
    this.cdr.detectChanges();
  }
  truncateText(text: string, limit: number): string {
    const words = text.split(' ');
    if (words.length <= limit) return text;
    return words.slice(0, limit).join(' ') + '...';
  }

  getMaterialActivityIndicator(materialId: string) {
    return combineLatest([
      this.allNotifications$,
      this.lastTimeCourseMapperOpened$,
    ]).pipe(
      map(([notifications, lastTimeCourseMapperOpened]) => {
        const lastTimeCourseMapperOpenedConverted = new Date(
          lastTimeCourseMapperOpened
        );
        const notificationsForTopic = notifications.filter(
          (notification) =>
            notification.material_id === materialId &&
            new Date(notification.timestamp) >
              lastTimeCourseMapperOpenedConverted &&
            !notification.isRead
        );
        return notificationsForTopic.length > 0;
      })
    );
  }

  getNumUnreadNotificationsForMaterial(materialId: string) {
    return this.store.select(getNotifications).pipe(
      map((notifications) => {
        if (!notifications) {
          return 0;
        }
        return notifications.filter(
          (notification) =>
            notification.material_id === materialId && !notification.isRead
        ).length;
      })
    );
  }
  onMaterialNotificationSettingsClicked(notificationOption: {
    label: string;
    control: FormControl<boolean>;
  }): void {
    const labelClicked: string = notificationOption.label;
    let objToSend = {
      materialId: this.materialIdOfMaterialMenuClicked,
      courseId: this.courseID,

      [materialNotificationSettingLabels.annotations]:
        labelClicked === materialNotificationSettingLabels.annotations
          ? !this.materialCheckBoxesGroup.value[
              materialNotificationSettingLabels.annotations
            ]
          : this.materialCheckBoxesGroup.value[
              materialNotificationSettingLabels.annotations
            ],
      [materialNotificationSettingLabels.commentsAndMentioned]:
        labelClicked === materialNotificationSettingLabels.commentsAndMentioned
          ? !this.materialCheckBoxesGroup.value[
              materialNotificationSettingLabels.commentsAndMentioned
            ]
          : this.materialCheckBoxesGroup.value[
              materialNotificationSettingLabels.commentsAndMentioned
            ],
      [materialNotificationSettingLabels.materialUpdates]:
        labelClicked === materialNotificationSettingLabels.materialUpdates
          ? !this.materialCheckBoxesGroup.value[
              materialNotificationSettingLabels.materialUpdates
            ]
          : this.materialCheckBoxesGroup.value[
              materialNotificationSettingLabels.materialUpdates
            ],
    };

    this.store.dispatch(
      CourseActions.setMaterialNotificationSettings({ settings: objToSend })
    );
  }

  onResetMaterialNotificationsClicked() {
    this.store.dispatch(
      CourseActions.unsetMaterialNotificationSettings({
        settings: {
          materialId: this.materialIdOfMaterialMenuClicked,
          courseId: this.courseID,
        },
      })
    );
  }

  onTabChange(e) {
    this.tabIndex = e.index - 1;
    this.intervalService.stopInterval();
    // if (this.tabIndex == -1 && this.showModeratorPrivileges) {
    if (this.tabIndex == -1) {
      this.isMaterialSelected = false;

      this.router.navigate([
        'course',
        this.selectedChannel.courseId,
        'channel',
        this.selectedChannel._id,
      ]);
    } else {
      this.isMaterialSelected = true;

      // if(!this.showModeratorPrivileges){
      //   this.tabIndex = e.index
      // }
      this.selectedMaterial = this.materials[this.tabIndex];
      this.updateSelectedMaterial();
      this.materialService
        .logMaterial(this.courseID, this.selectedMaterial._id)
        .subscribe();
      if (this.selectedMaterial.type == 'pdf') {
        this.store.dispatch(
          MaterialActions.setMaterialId({
            materialId: this.selectedMaterial._id,
          })
        );
        this.store.dispatch(
          MaterialActions.setCurrentMaterial({
            selcetedMaterial: this.selectedMaterial,
          })
        );
        this.store.dispatch(
          AnnotationActions.setCurrentPdfPage({ pdfCurrentPage: 1 })
        );
        this.store.dispatch(AnnotationActions.loadAnnotations());
        this.router.navigate([
          'course',
          this.selectedMaterial['courseId'],
          'channel',
          this.selectedMaterial['channelId'],
          'material',
          { outlets: { material: [this.selectedMaterial._id, 'pdf'] } },
        ]);
      } else if (this.selectedMaterial.type == 'video') {
        this.store.dispatch(
          MaterialActions.setMaterialId({
            materialId: this.selectedMaterial._id,
          })
        );
        this.store.dispatch(
          MaterialActions.setCurrentMaterial({
            selcetedMaterial: this.selectedMaterial,
          })
        );
        this.store.dispatch(VideoActions.SetSeekVideo({ seekVideo: [0, 0] }));
        this.store.dispatch(VideoActions.SetCurrentTime({ currentTime: 0 }));
        this.store.dispatch(AnnotationActions.loadAnnotations());
        this.router.navigate([
          'course',
          this.selectedMaterial['courseId'],
          'channel',
          this.selectedMaterial['channelId'],
          'material',
          { outlets: { material: [this.selectedMaterial._id, 'video'] } },
        ]);
      }
    }
  }
  setSelectedTabIndex(index: number) {
    this.selectedMaterial = this.selectedChannel.materials[index];
    this.updateSelectedMaterial();
  }

  updateSelectedMaterial() {
    // if(this.selectedChannel.materials && !this.selectedMaterial){
    //   this.tabIndex=0
    //   this.selectedMaterial=this.selectedChannel.materials[0]
    // }
    if (!this.selectedMaterial) return;
    switch (this.selectedMaterial.type) {
      case 'pdf':
        this.pdfViewService.setPageNumber(1);
        let url =
          this.selectedMaterial?.url + this.selectedMaterial?._id + '.pdf';
        this.pdfViewService.setPdfURL(url);
        break;
      case 'video':
        if (this.selectedMaterial?.url == '') {
          let urlvideo =
            '/public/uploads/videos/' + this.selectedMaterial?._id + '.mp4';
          this.pdfViewService.setPdfURL(urlvideo);
        } else {
          this.pdfViewService.setPdfURL(this.selectedMaterial?.url);
        }
        break;

      default:
    }
    this.store.dispatch(
      MaterialActions.setCurrentMaterial({
        selcetedMaterial: this.selectedMaterial,
      })
    );
    this.store.dispatch(
      MaterialActions.setMaterialId({ materialId: this.selectedMaterial._id })
    );
    this.materialID = this.selectedMaterial._id;

    this.store.dispatch(AnnotationActions.loadAnnotations());
  }

  onDeleteMaterial() {
    this.confirmationService.confirm({
      message:
        'Do you want to delete "' + this.selectedMaterial.name + '" material?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: (e) => this.deleteMaterial(e),
      reject: () => {
        // this.informUser('info', 'Cancelled', 'Deletion cancelled')
      },
    });
    setTimeout(() => {
      const rejectButton = document.getElementsByClassName(
        'p-confirm-dialog-reject'
      ) as HTMLCollectionOf<HTMLElement>;
      for (var i = 0; i < rejectButton.length; i++) {
        this.renderer.addClass(rejectButton[i], 'p-button-outlined');
      }
    }, 0);
  }
  deleteMaterial(e) {
    // e.index1 = e.index - 1;

    // this.selectedMaterial = this.materials[e.index1];
    if (this.selectedMaterial.type == 'video' && this.selectedMaterial.url) {
      this.materialService.deleteMaterial(this.selectedMaterial).subscribe({
        next: (data) => {
          this.topicChannelService.selectChannel(this.selectedChannel);
          this.store.dispatch(
            CourseActions.updateFOllowingAnnotationsOnDeletion({
              payload: {
                id: this.selectedMaterial._id,
                isDeletingMaterial: true,
              },
            })
          );
          if ('success' in data) {
            this.store.dispatch(
              NotificationActions.isDeletingMaterial({
                materialId: this.selectedMaterial._id,
              })
            );
          }
          this.router.navigate([
            'course',
            this.selectedMaterial['courseId'],
            'channel',
            this.selectedMaterial['channelId'],
          ]);
          /*  e.index = 1; */
        },
        error: (err) => {
          this.errorMessage = err.error.message;
        },
      });
    } else if (
      (this.selectedMaterial.type == 'pdf' && this.selectedMaterial.url) ||
      (this.selectedMaterial.type == 'video' && this.selectedMaterial.url == '')
    ) {
      this.materialService.deleteFile(this.selectedMaterial).subscribe({
        next: (res) => {
          this.store.dispatch(
            CourseActions.updateFOllowingAnnotationsOnDeletion({
              payload: {
                id: this.selectedMaterial._id,
                isDeletingMaterial: true,
              },
            })
          );

          this.store.dispatch(
            NotificationActions.isDeletingMaterial({
              materialId: this.selectedMaterial._id,
            })
          );
        },
      });
    }

    this.materialService.deleteMaterial(this.selectedMaterial).subscribe({
      next: (data) => {
        this.topicChannelService.selectChannel(this.selectedChannel);
        this.router.navigate([
          'course',
          this.selectedMaterial['courseId'],
          'channel',
          this.selectedMaterial['channelId'],
        ]);

        // e.index = 1
        this.showInfo('Material successfully deleted!');
      },
      error: (err) => {
        this.errorMessage = err.error.message;
      },
    });
  }

  reloadCurrentRoute() {
    let currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  onRenameMaterial() {
    let selectedMat = <HTMLInputElement>(
      document.getElementById(`${this.selectedMaterial._id}`)
    );

    this.selectedId = this.selectedMaterial._id;

    this.editable = true;
    selectedMat.contentEditable = 'true';
    this.previousMaterial = this.selectedMaterial;

    if (selectedMat.textContent === '') {
      selectedMat.textContent = this.previousMaterial.name;
    }

    // this.previousMaterial = this.selectedMaterial;
    this.selectElementContents(selectedMat);
  }
  selectElementContents(el) {
    // select text on rename
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  onRenameMaterialConfirm(id) {
    let selectedMat = <HTMLElement>document.getElementById(`${id}`);

    //const selectedMat = <HTMLInputElement>document.getElementById(id);

    selectedMat.contentEditable = 'true'; // Disable editing after rename

    if (this.enterKey) {
      //confirmed by keyboard

      let MaterialName = this.previousMaterial.name;
      const materialDescription = this.previousMaterial.description;
      const curseId = this.previousMaterial.courseId;
      const matId = this.previousMaterial._id;
      const matUrl = this.previousMaterial.url;
      const mattype = this.previousMaterial.type;

      if (this.insertedText && this.insertedText.trim() !== MaterialName) {
        let newMaterialName = this.insertedText
          .trim()
          .replace(/(\r\n|\n|\r)/gm, '');

        let body = {
          name: newMaterialName,
          description: materialDescription, //keep description value
          courseId: curseId,
          materialId: matId,
          url: matUrl,
          type: mattype,
        };

        this.enterKey = false;
        this.materialService
          .renameMaterial(curseId, this.previousMaterial, body)
          .subscribe(() => {
            // Find and update the corresponding material in the materials array
            // const existingMaterial = this.materials.find(mat => mat._id === this.previousMaterial._id);
            // if (existingMaterial) {
            //   existingMaterial.name = newMaterialName; // Update the name
            // }
            // Create a copy of previousMaterial and selectedMaterial and update the name
            this.previousMaterial = {
              ...this.previousMaterial,
              name: newMaterialName,
            };
            this.selectedMaterial = {
              ...this.selectedMaterial,
              name: newMaterialName,
            };
            // Update the materials array and keep the tab open
            this.materials = this.materials.map((mat, index) => {
              if (mat._id === this.selectedMaterial._id) {
                // Update the material name
                const updatedMaterial = { ...mat, name: newMaterialName };

                // Keep the material tab open by maintaining tabIndex
                this.tabIndex = index + 1; // Since tabIndex starts from 1, add 1 to the index

                return updatedMaterial; // Return the updated material
              }
              return mat; // Return unchanged materials
            });
            // Force change detection to update the view
            this.cdr.detectChanges();
            this.editable = false; // Exit edit mode
            selectedMat.contentEditable = 'false'; // Disable editing after rename
          });
        this.insertedText = '';
      }
    } else if (this.escapeKey === true) {
      //ESC pressed

      let MaterialName = this.previousMaterial.name;
      const MaterialDescription = this.previousMaterial.description;
      const curseId = this.previousMaterial.courseId;

      const matId = this.previousMaterial._id;
      const matUrl = this.previousMaterial.url;
      const mattype = this.previousMaterial.type;

      let body = {
        name: MaterialName,
        description: MaterialDescription,
        courseId: curseId,
        materialId: matId,
        url: matUrl,
        type: mattype,
      };
      this.escapeKey = false;
      this.materialService
        .renameMaterial(curseId, this.selectedMaterial, body)
        .subscribe(() => {
          // Only disable editing after renaming is confirmed
          if (selectedMat) {
            selectedMat.contentEditable = 'false'; // Disable editing after rename
          }
          this.editable = false; // Exit edit mode
        });
      this.insertedText = '';
    } else {
      //confirmed by mouse click

      let MaterialName = this.previousMaterial.name;
      const MaterialDescription = this.previousMaterial.description;
      const curseId = this.previousMaterial.courseId;
      const matId = this.previousMaterial._id;
      const matUrl = this.previousMaterial.url;
      const mattype = this.previousMaterial.type;

      let body = {
        name: MaterialName,
        description: MaterialDescription,
        courseId: curseId,
        materialId: matId,
        url: matUrl,
        type: mattype,
      };
      if (
        this.insertedText &&
        this.insertedText.trim() !== this.previousMaterial.name
      ) {
        let newMaterialName = this.insertedText.trim();

        newMaterialName = newMaterialName.replace(/(\r\n|\n|\r)/gm, ''); //remove newlines

        if (newMaterialName === '') {
          this.insertedText = this.previousMaterial.name;
          selectedMat.textContent = this.previousMaterial.name;
          selectedMat.contentEditable = 'false'; // Disable editing after rename
          this.editable = false; // Exit edit mode
          this.insertedText = '';
        }
        if (newMaterialName && newMaterialName !== '') {
          body = {
            name: newMaterialName,
            description: MaterialDescription, //keep description value
            courseId: curseId,
            materialId: matId,
            url: matUrl,
            type: mattype,
          };

          this.materialService
            .renameMaterial(curseId, this.previousMaterial, body)
            .subscribe(() => {
              this.previousMaterial = {
                ...this.previousMaterial,
                name: newMaterialName,
              };
              this.selectedMaterial = {
                ...this.selectedMaterial,
                name: newMaterialName,
              };

              // Update the materials array and keep the tab open
              this.materials = this.materials.map((mat, index) => {
                if (mat._id === this.selectedMaterial._id) {
                  // Update the material name
                  const updatedMaterial = { ...mat, name: newMaterialName };

                  // Keep the material tab open by maintaining tabIndex
                  this.tabIndex = index + 1; // Since tabIndex starts from 1, add 1 to the index

                  return updatedMaterial; // Return the updated material
                }
                return mat; // Return unchanged materials
              });

              // Force change detection to update the view
              this.cdr.detectChanges();
              // Only disable editing after renaming is confirmed
              if (selectedMat) {
                selectedMat.contentEditable = 'false'; // Disable editing after rename
              }
              this.editable = false; // Exit edit mode
            });
          this.insertedText = '';
        }
      }
    }
  }

  @HostListener('document:click', ['$event'])
  documentClick(event: MouseEvent) {
    // to confirm rename when mouse clicked anywhere

    // if (this.editable) {
    //   //course name <p> has been changed to editable
    //   //
    //   this.enterKey = false;
    //   this.onRenameMaterialConfirm(this.selectedId);
    // }
    const clickedElement = event.target as HTMLElement;

    // If the click was outside the material element, confirm the rename
    if (this.editable && clickedElement.id !== this.selectedId) {
      this.enterKey = false;
      this.onRenameMaterialConfirm(this.selectedId);

      this.editable = false; // Disable editing mode
    }
  }

  onTextInserted(id, e) {
    ////Prevent Special keys
    this.editable = true;
    if (
      window.getSelection().toString() ==
      (<HTMLInputElement>document.getElementById(id)).innerText
    ) {
      //all text is selected
      if (e.keyCode === 32) {
        //spacebar pressed when text is selected
        e.preventDefault(); //prevent text modification
      } else if (e.keyCode === 13) {
        // Enter pressed && All Text is selected
        e.preventDefault();
        let inText = (<HTMLInputElement>document.getElementById(id)).innerText;
        if (/\s/g.test(inText)) {
          //name !== null or white space(s)
          (<HTMLInputElement>document.getElementById(id)).contentEditable =
            'false';
          window.getSelection().removeAllRanges(); // deselect text on confirm
          this.enterKey = true;
          this.onRenameMaterialConfirm(id);
        } else if (!/\s/g.test(inText)) {
          // this.showError('Course name field is empty');
        } //name is null or white space(s)
      } else if (e.keyCode === 27) {
        // on ESC pressed
        e.preventDefault();
        (<HTMLInputElement>document.getElementById(id)).contentEditable =
          'false';
        this.insertedText = this.selectedMaterial.name;

        window.getSelection().removeAllRanges(); // deselect text on confirm
        // (<HTMLInputElement>document.getElementById(id)).innerText=this.insertedText
        this.escapeKey = true;
        this.onRenameMaterialConfirm(id);
      }
    } else if (e.keyCode === 13) {
      /**if text is not selected check following cases */
      // on Enter pressed
      // e.preventDefault();
      (<HTMLInputElement>document.getElementById(id)).contentEditable = 'false';
      window.getSelection().removeAllRanges(); // deselect text on confirm
      this.enterKey = true;
      this.onRenameMaterialConfirm(id);
    } else if (e.keyCode === 27) {
      // on ESC pressed
      (<HTMLInputElement>document.getElementById(id)).contentEditable = 'false';
      this.insertedText = this.selectedMaterial.name;

      window.getSelection().removeAllRanges(); // deselect text on confirm
      this.escapeKey = true;
      // (<HTMLInputElement>document.getElementById(id)).innerHTML=this.insertedText;
      this.onRenameMaterialConfirm(id);
    }
    // else if(e.keyCode===8 || e.keyCode===46){//Backspace || Delete
    //   //Do Nothing
    // }
    // // else{
    // //   this.insertedText= (<HTMLInputElement>document.getElementById(id)).innerText
    // //   if (e.key.length===1){this.insertedText=this.insertedText+e.key}
    // // }
  }

  afterTextInserted(id, e) {
    //check on button release | get inner text as long as it's inserted
    if (e.keyCode === 8 || e.keyCode === 46) {
      //Backspace || delete
      this.insertedText = (<HTMLInputElement>(
        document.getElementById(id)
      )).innerText;
    } else if (e.keyCode !== 32 && e.keyCode !== 27) {
      //not (enter, esc)
      this.insertedText = (<HTMLInputElement>(
        document.getElementById(id)
      )).innerText;
    }
  }

  // onConceptMapButtonClicked(show: boolean) {
  //   this.showConceptMapEvent=show
  // }
  onConceptMapButtonClicked(show: boolean) {
    this.conceptMapEvent.emit(show);
    this.cmSelected = show;
    this.selectedToolEvent.emit('none');
    this.materialKgService.materialKgOrdered(this.selectedMaterial);
  }

  materialMenuButtonClicked($event, material: Material) {
    this.selectedMaterial = material;
    this.materialMenu.toggle($event);
    this.materialIdOfMaterialMenuClicked = material._id;
    this.courseID = material.courseId;
    this.store.dispatch(
      CourseActions.setLastMaterialMenuClicked({
        lastMaterialMenuClickedId: material._id,
      })
    );
  }

  /**
   * @function showInfo
   * shows the user if his action succeeded
   *
   */
  showInfo(msg) {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: msg,
    });
  }

  /**
   * @function informUser
   * inform user about the result of his action
   *
   */
  informUser(severity, summary, detail) {
    this.messageService.add({
      severity: severity,
      summary: summary,
      detail: detail,
    });
  }

  viewMaterialDashboardClicked() {
    //Log the activity
    this.materialService
      .logAccessMaterialDashboard(this.materialID)
      .subscribe();
    this.router.navigate([
      'course',
      this.courseService.getSelectedCourse()._id,
      'channel',
      this.selectedMaterial['channelId'],
      'materialDashboard',
      this.materialID,
      'dashboard',
    ]);
  }
}
