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
} from '@angular/core';
import { Channel } from 'src/app/models/Channel';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { ElementRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Material } from 'src/app/models/Material';
import { PdfviewService } from 'src/app/services/pdfview.service';
import { MaterilasService } from 'src/app/services/materials.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  State,
} from 'src/app/pages/components/materils/state/materials.reducer';
import * as MaterialActions from 'src/app/pages/components/materils/state/materials.actions';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ModeratorPrivilegesService } from 'src/app/services/moderator-privileges.service';
import * as  CourseActions from 'src/app/pages/courses/state/course.actions'
@Component({
  selector: 'app-material',
  templateUrl: './material.component.html',
  styleUrls: ['./material.component.css'],
  providers: [MessageService, ConfirmationService],
})
export class MaterialComponent implements OnInit, OnDestroy {
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

  showModeratorPrivileges: boolean;
  privilegesSubscription: Subscription;
  constructor(
    private topicChannelService: TopicChannelService,
    private pdfViewService: PdfviewService,
    private materialService: MaterilasService,
    private router: Router,
    private store: Store<State>,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private moderatorPrivilegesService: ModeratorPrivilegesService,
    private renderer: Renderer2
  ) {
    const url = this.router.url;
    if (url.includes('course') && url.includes('channel')) {
      const courseRegex = /\/course\/(\w+)/;
      const channelRegex = /\/channel\/(\w+)/;
      const courseId = courseRegex.exec(url)[1];
      const channelId = channelRegex.exec(url)[1];
      const materialId = url.match(/material:(.*?)\/(pdf|video)/)?.[1];
      this.topicChannelService
        .getChannel(courseId, channelId)
        .subscribe((foundChannel) => {
          this.selectedChannel = foundChannel;
          this.materials = foundChannel.materials;
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
  }
  materialOptions: MenuItem[] = [
    {
      label: 'Rename',
      icon: 'pi pi-refresh',
      command: () => this.onRenameMaterial(),
    },
    {
      label: 'Delete',
      icon: 'pi pi-times',
      command: () => this.onDeleteMaterial(),
    },
  ];
  ngOnDestroy(): void {}

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
  }

  onTabChange(e) {
    this.tabIndex = e.index - 1;
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
          this.router.navigate([
            'course',
            this.selectedMaterial['courseId'],
            'channel',
            this.selectedMaterial['channelId'],
          ]);
          e.index = 1;
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
        next: (res) => {},
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
    console.log(selectedMat);
    this.selectedId = this.selectedMaterial._id;
    selectedMat.contentEditable = 'true';
    this.previousMaterial = this.selectedMaterial;
    this.previousMaterial = this.selectedMaterial;
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
    const selectedMat = <HTMLInputElement>document.getElementById(id);
    if (this.enterKey) {
      //confirmed by keyboard
      let MaterialName = this.previousMaterial.name;
      const materialDescription = this.previousMaterial.description;
      const curseId = this.previousMaterial.courseId;
      const matId = this.previousMaterial._id;
      const matUrl = this.previousMaterial.url;
      const mattype = this.previousMaterial.type;
      let body = {
        name: MaterialName,
        description: materialDescription,
        courseId: curseId,
        materialId: matId,
        url: matUrl,
        type: mattype,
      };
      let newMaterialName = this.insertedText;
      newMaterialName = newMaterialName.replace(/(\r\n|\n|\r)/gm, ''); //remove newlines
      if (newMaterialName && newMaterialName !== '') {
        body = {
          name: newMaterialName,
          description: materialDescription, //keep description value
          courseId: curseId,
          materialId: matId,
          url: matUrl,
          type: mattype,
        };
      }
      this.enterKey = false;
      this.materialService
        .renameMaterial(curseId, this.previousMaterial, body)
        .subscribe();
    } else if (this.escapeKey === true) {
      //ESC pressed
      console.log('ESC Pressed');
      console.log(this.previousMaterial);
      let MaterialName = this.previousMaterial.name;
      const MaterialDescription = this.previousMaterial.description;
      const curseId = this.previousMaterial.courseId;
      console.log(curseId);
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
        .subscribe();
    } else {
      //confirmed by mouse click
      console.log('logged from mouse');
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
      let newMaterialName = this.insertedText;
      newMaterialName = newMaterialName.replace(/(\r\n|\n|\r)/gm, ''); //remove newlines
      if (
        newMaterialName &&
        newMaterialName !== '' &&
        newMaterialName !== this.previousMaterial.name
      ) {
        body = {
          name: newMaterialName,
          description: MaterialDescription, //keep description value
          courseId: curseId,
          materialId: matId,
          url: matUrl,
          type: mattype,
        };
      }
      this.editable = false;
      this.materialService
        .renameMaterial(curseId, this.previousMaterial, body)
        .subscribe();
    }
  }

  @HostListener('document:click', ['$event'])
  documentClick(event: MouseEvent) {
    // to confirm rename when mouse clicked anywhere
    if (this.editable) {
      //course name <p> has been changed to editable
      console.log('logged to mouse event');
      this.enterKey = false;
      this.onRenameMaterialConfirm(this.selectedId);
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

  /**
   * @function showInfo
   * shows the user if his action succeeded
   *
   */
  showInfo(msg) {
    this.messageService.add({
      severity: 'info',
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
}
