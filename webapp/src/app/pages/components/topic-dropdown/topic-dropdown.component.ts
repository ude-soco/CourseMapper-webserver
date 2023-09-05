import {
  Component,
  EventEmitter,
  OnInit,
  HostListener,
  Input,
  Renderer2,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Channel } from 'src/app/models/Channel';
import { Topic } from 'src/app/models/Topic';
import { CourseService } from 'src/app/services/course.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Material } from 'src/app/models/Material';
import { MaterilasService } from 'src/app/services/materials.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import * as MaterialActions from 'src/app/pages/components/materials/state/materials.actions';
import { State } from '../materials/state/materials.reducer';
import * as CourseActions from 'src/app/pages/courses/state/course.actions';
import { FormBuilder, FormControl } from '@angular/forms';
import { Observable } from 'rxjs/internal/Observable';
import {
  getNotificationSettingsOfLastChannelMenuClicked,
  getNotificationSettingsOfLastTopicMenuClicked,
  getFollowingAnnotationsOfDisplayedChannels,
} from '../../courses/state/course.reducer';
import {
  topicNotificationSettingLabels,
  channelNotificationSettingLabels,
} from 'src/app/models/Notification';
import { map, tap } from 'rxjs';
import { getNotifications } from '../notifications/state/notifications.reducer';
@Component({
  selector: 'app-topic-dropdown',
  templateUrl: './topic-dropdown.component.html',
  styleUrls: ['./topic-dropdown.component.css'],
  providers: [MessageService, ConfirmationService],
})
export class TopicDropdownComponent implements OnInit {
  constructor(
    private courseService: CourseService,
    private topicChannelService: TopicChannelService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private materilasService: MaterilasService,
    private router: Router,
    private store: Store<State>,
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private changeDetectorRef: ChangeDetectorRef,
    protected fb: FormBuilder
  ) {
    const url = this.router.url;
    if (url.includes('course') && url.includes('channel')) {
      const courseRegex = /\/course\/(\w+)/;
      const channelRegex = /\/channel\/(\w+)/;
      const courseId = courseRegex.exec(url)[1];
      const channelId = channelRegex.exec(url)[1];
      const materialId = url.match(/material:(.*?)\/(pdf|video)/)?.[1];
      this.topicChannelService.fetchTopics(courseId).subscribe((res) => {
        this.selectedTopic = res.course.topics.find((topic) =>
          topic.channels.find((channel) => channel._id === channelId)
        );
        this.onSelectTopic(this.selectedTopic);
        this.selectedChannelId = channelId;
      });
    } else {
      this.selectedChannelId = null;
      this.selectedChannel = null;
    }
  }
  @Input() showModeratorPrivileges: boolean;
  @ViewChild('topicMenu') topicMenu: any;
  @ViewChild('channelMenu') channelMenu: any;
  topics: Topic[] = [];
  displayAddChannelDialogue: boolean = false;
  selectedTopic: Topic = null;
  prevSelectedTopic = null;
  selectedChannel = null;
  selectedChannelId = null;
  editable: boolean = false;
  escapeKey: boolean = false;
  enterKey: boolean = false;
  textFromTopic: boolean = false;
  textFromChannel: boolean = false;
  previousTopic = null;
  previousChannel = null;
  insertedText: string = '';
  selectedIdTp: string = '';
  selectedIdCh: string = '';
  expandTopic = [];
  selectedCourseId = null;
  prevSelectedCourseId = null;
  protected checkBoxesGroup = this.fb.group({});
  checkBoxesArray: { label: string; control: FormControl<boolean> }[] = [];
  protected channelCheckBoxesGroup = this.fb.group({});
  channelCheckBoxesArray: { label: string; control: FormControl<boolean> }[] =
    [];
  channelIdOfChannelMenuClicked: string;
  topicIdOfTopicMenuClicked: string = null;

  notificationSettingsOfLastTopicMenuClicked$: Observable<
    {
      label: string;
      value: boolean;
    }[]
  > = null;
  notificationSettingsOfLastChannelMenuClicked$: Observable<
    {
      label: string;
      value: boolean;
    }[]
  > = null;
  isResetTopicNotificationsButtonEnabled: boolean;
  isResetChannelNotificationsButtonEnabled: boolean;
  followingAnnotationsOfDisplayedChannels$: Observable<any> = null;

  topicOptions: MenuItem[] = [
    {
      label: 'Rename',
      icon: 'pi pi-refresh',
      command: () => this.onRenameTopic(),
    },
    {
      label: 'Delete',
      icon: 'pi pi-times',
      command: () => this.onDeleteTopic(),
    },
    {
      label: 'Notification Settings',
      icon: 'pi pi-bell',
      /* command: () => this.onTopicNotificationSettingsClicked(), */
    },
  ];
  channelsOptions: MenuItem[] = [
    {
      label: 'Rename',
      icon: 'pi pi-refresh',
      command: () => this.onRenameChannel(),
    },
    {
      label: 'Delete',
      icon: 'pi pi-times',
      command: () => this.onDeleteChannel(),
    },
  ];
  //TODO Remove the null default values. not needed. form controls supply the values.
  notificationOptions = [
    {
      label: topicNotificationSettingLabels.courseDefault,
      value: null,
    },
    {
      label: topicNotificationSettingLabels.topicUpdates,
      value: null,
    },
    {
      label: topicNotificationSettingLabels.commentsAndMentioned,
      value: null,
    },
    {
      label: topicNotificationSettingLabels.annotations,
      value: null,
    },
  ];

  ngOnInit(): void {
    this.topicChannelService
      .fetchTopics(this.courseService.getSelectedCourse()._id)
      .subscribe((res) => {
        this.topics = res.course.topics;
        console.log(res.notificationSettings);
        this.store.dispatch(
          CourseActions.initialiseNotificationSettings({
            notificationSettings: res.notificationSettings,
          })
        );
      });

    this.topicChannelService.onUpdateTopics$.subscribe(
      (topics) => (this.topics = topics)
    );

    this.notificationSettingsOfLastTopicMenuClicked$ = this.store.select(
      getNotificationSettingsOfLastTopicMenuClicked
    );
    this.notificationSettingsOfLastChannelMenuClicked$ = this.store.select(
      getNotificationSettingsOfLastChannelMenuClicked
    );
    //loop over the notification options and make a form control
    this.notificationSettingsOfLastTopicMenuClicked$.subscribe(
      (notificationSettings) => {
        console.log('TOPIC ID CHANGED');
        if (!notificationSettings) return;
        //delete all the controls in the form Group
        this.checkBoxesGroup = this.fb.group({});
        this.checkBoxesArray = [];
        notificationSettings.forEach((o, index) => {
          if (index === 0) {
            this.isResetTopicNotificationsButtonEnabled = o.value;
            return;
          }
          const control = new FormControl<boolean>(o.value);
          this.checkBoxesArray.push({ label: o.label, control: control });
          this.checkBoxesGroup.addControl(o.label, control);
        });
      }
    );
    this.notificationSettingsOfLastChannelMenuClicked$.subscribe(
      (notificationSettings) => {
        console.log('CHANNEL ID CHANGED');
        if (!notificationSettings) return;
        //delete all the controls in the form Group
        this.channelCheckBoxesGroup = this.fb.group({});
        this.channelCheckBoxesArray = [];
        notificationSettings.forEach((o, index) => {
          if (index === 0) {
            this.isResetChannelNotificationsButtonEnabled = o.value;
            return;
          }
          const control = new FormControl<boolean>(o.value);
          this.channelCheckBoxesArray.push({
            label: o.label,
            control: control,
          });
          this.channelCheckBoxesGroup.addControl(o.label, control);
        });
        console.log(this.channelCheckBoxesArray);
        console.log(this.channelCheckBoxesGroup);
      }
    );

    this.followingAnnotationsOfDisplayedChannels$ = this.store.select(
      getFollowingAnnotationsOfDisplayedChannels
    );
  }

  getNumUnreadNotificationsForTopic(topicId: string) {
    return this.store.select(getNotifications).pipe(
      map((notifications) => {
        if (!notifications) {
          return 0;
        }
        return notifications.filter(
          (notification) =>
            notification.topic_id === topicId && !notification.isRead
        ).length;
      })
    );
  }

  getNumUnreadNotificationsForChannel(channelId: string) {
    return this.store.select(getNotifications).pipe(
      map((notifications) => {
        if (!notifications) {
          return 0;
        }
        return notifications.filter(
          (notification) =>
            notification.channel_id === channelId && !notification.isRead
        ).length;
      })
    );
  }
  /*   getNumUnreadNotificationsForAnnotation(annotationlId: string) {
    return this.store.select(getNotifications).pipe(
      map((notifications) => {
        if (!notifications) {
          return 0;
        }
        return notifications.filter(
          (notification) =>
            notification.annotationId === channelId && !notification.isRead
        ).length;
      })
    );
  } */

  getFollowingAnnotationsOfDisplayedChannels(channelId: string) {
    return this.followingAnnotationsOfDisplayedChannels$.pipe(
      map((followingAnnotations) => {
        if (!followingAnnotations) {
          return [];
        }
        return followingAnnotations[channelId];
      })
    );
  }

  ngOnDestroy() {
    this.expandTopic = null;
    this.selectedChannelId = null;
  }

  ngAfterViewChecked() {
    //   if(this.prevSelectedTopic!==this.selectedTopic){
    //   console.log(this.selectedTopic)
    //   this.prevSelectedTopic=this.selectedTopic
    // }
    this.selectedCourseId = this.courseService.getSelectedCourse()._id;
    if (this.selectedCourseId !== this.prevSelectedCourseId) {
      this.prevSelectedCourseId = this.selectedCourseId;
      this.selectedChannelId = null;

      //to avoid error messages when values got changed after being checked
      this.changeDetectorRef.detectChanges();
    }
  }

  @HostListener('document:click', ['$event'])
  documentClick(event: MouseEvent) {
    // to confirm rename when mouse clicked anywhere
    if (this.editable) {
      //course name <p> has been changed to editable
      this.enterKey = false;
      if (this.textFromChannel) {
        this.onRenameConfirmedChannel(this.selectedIdCh);
      } else if (this.textFromTopic) {
        this.onRenameConfirmedTopic(this.selectedIdTp);
      }
    }
  }

  showMenu() {}

  onSelectTopic(topic: Topic) {
    // console.log(this.selectedTopic)
    if (this.expandTopic.includes(topic._id)) {
      this.expandTopic.some((topicId, index) => {
        if (topicId === topic._id) {
          this.expandTopic.splice(index, 1);
        }
      });
      this.store.dispatch(
        CourseActions.setCurrentTopic({ selcetedTopic: null })
      );
    } else {
      this.expandTopic = [];
      this.expandTopic.push(topic._id);
      this.store.dispatch(
        CourseActions.setCurrentTopic({ selcetedTopic: topic })
      );
      // wait until expanded topic rendered
      setTimeout(() => {
        // if exists channel previously selected --> make channel container bg=white
        if (
          this.selectedChannelId &&
          topic.channels.find((channl) => channl._id === this.selectedChannelId)
        ) {
          let channelNameContainer = document.getElementById(
            this.selectedChannelId + '-container'
          );
          channelNameContainer.style.backgroundColor = 'white';
        }
      }, 2);
    }
  }
  onSelectChannel(channel: Channel) {
    //3
    this.selectedCourseId = this.courseService.getSelectedCourse()._id;
    this.prevSelectedCourseId = this.selectedCourseId;
    this.topicChannelService.selectChannel(channel);
    this.router.navigate([
      'course',
      this.courseService.getSelectedCourse()._id,
      'channel',
      channel._id,
    ]);
    this.store.dispatch(
      CourseActions.toggleChannelSelected({ channelSelected: true })
    );
    this.store.dispatch(
      CourseActions.SetSelectedChannel({ selectedChannel: channel })
    );
    this.store.dispatch(
      MaterialActions.setCurrentMaterial({ selcetedMaterial: null })
    );
    // make selected channel's background white
    this.selectedChannelId = channel._id;

    // make all channels' container background Null
    this.topics.forEach((topic) => {
      topic.channels.forEach((channelEle) => {
        var nonSelectedChannels = document.getElementById(
          channelEle._id + '-container'
        );
        if (nonSelectedChannels) {
          nonSelectedChannels.style.backgroundColor = null;
        }
      });
    });
    // make selected channel's container background white
    let channelNameContainer = document.getElementById(
      channel._id + '-container'
    );
    channelNameContainer.style.backgroundColor = 'white';
  }

  /**
   * @function onDeleteTopic
   * Captures topic deletion from ui
   *
   */
  onDeleteTopic() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this topic?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => this.confirmTopicDeletion(),
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

  /**
   * @function confirmTopicDeletion
   * Captures topic deletion confirmation from ui
   *
   */
  confirmTopicDeletion() {
    this.topicChannelService
      .deleteTopic(this.selectedTopic)
      .subscribe((res) => {
        if ('success' in res) {
          // this.showInfo(res['success']);
          this.showInfo('Topic successfully deleted!');
          this.router.navigate([
            'course',
            this.courseService.getSelectedCourse()._id,
          ]);
          this.store.dispatch(
            CourseActions.SetSelectedChannel({ selectedChannel: null })
          );
          this.store.dispatch(
            CourseActions.toggleChannelSelected({ channelSelected: false })
          );
        } else {
          this.showError(res['errorMsg']);
        }
      });
  }

  onRenameTopic() {
    let selectedTopic = <HTMLInputElement>(
      document.getElementById(`${this.selectedTopic._id}`)
    );
    selectedTopic.contentEditable = 'true';
    this.selectElementContents(selectedTopic);
    this.selectedIdTp = this.selectedTopic._id;
    this.previousTopic = this.selectedTopic;
    this.insertedText = '';
  }
  onRenameConfirmedTopic(id) {
    this.textFromTopic = false;
    if (this.enterKey) {
      //confirmed by keyboard
      let topicName = this.previousTopic.name;
      let body = { name: topicName };
      let newTopicName = this.insertedText;
      newTopicName = newTopicName.replace(/(\r\n|\n|\r)/gm, ''); //remove newlines
      if (newTopicName && newTopicName !== '') {
        body = {
          name: newTopicName,
        };
      }
      this.enterKey = false;
      this.topicChannelService
        .renameTopic(this.previousTopic, body)
        .subscribe();
      this.selectedTopic.name = body.name;
    } else if (this.escapeKey === true) {
      //ESC pressed
      //console.log('ESC Pressed');
      this.escapeKey = false;
    } else {
      //confirmed by mouse click
      let topicName = this.previousTopic.name;
      let body = { name: topicName };
      let newTopicName = this.insertedText;
      newTopicName = newTopicName.replace(/(\r\n|\n|\r)/gm, ''); //remove newlines
      if (
        newTopicName &&
        newTopicName !== '' &&
        newTopicName !== this.previousTopic.name &&
        /\s/g.test(newTopicName)
      ) {
        body = {
          name: newTopicName,
        };
      } else if (!/\s/g.test(newTopicName)) {
        (<HTMLInputElement>document.getElementById(id)).innerText =
          this.previousTopic.name;
      }
      this.editable = false;
      this.topicChannelService
        .renameTopic(this.previousTopic, body)
        .subscribe();
      this.selectedTopic.name = body.name;
    }
  }
  onTextInsertedTopic(id, e) {
    //Prevent Special keys
    this.editable = true;
    this.textFromTopic = true;
    // console.log(e.keyCode);
    // console.log(e);
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
          this.onRenameConfirmedTopic(id);
        } else if (!/\s/g.test(inText)) {
          this.showError('Topic name field is empty');
        } //name is null or white space(s)
      } else if (e.keyCode === 27) {
        // on ESC pressed
        (<HTMLInputElement>document.getElementById(id)).contentEditable =
          'false';
        this.insertedText = this.selectedTopic.name;
        window.getSelection().removeAllRanges(); // deselect text on confirm
        this.escapeKey = true;
        (<HTMLInputElement>document.getElementById(id)).innerText =
          this.previousTopic.name;
        this.onRenameConfirmedTopic(id);
      }
    } else if (e.keyCode === 13) {
      /**if text is not selected check following cases */
      // on Enter pressed
      (<HTMLInputElement>document.getElementById(id)).contentEditable = 'false';
      window.getSelection().removeAllRanges(); // deselect text on confirm
      this.enterKey = true;
      this.onRenameConfirmedTopic(id);
    } else if (e.keyCode === 27) {
      // on ESC pressed
      (<HTMLInputElement>document.getElementById(id)).contentEditable = 'false';
      this.insertedText = this.selectedTopic.name;
      window.getSelection().removeAllRanges(); // deselect text on confirm
      this.escapeKey = true;
      (<HTMLInputElement>document.getElementById(id)).innerText =
        this.previousTopic.name;
      this.onRenameConfirmedTopic(id);
    }
  }
  afterTextInsertedTopic(id, e) {
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
   * @function onDeleteChannel
   * Captures channel deletion from ui
   *
   */
  onDeleteChannel() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this channel?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => this.confirmChannelDeletion(),
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

  /**
   * @function confirmChannelDeletion
   * Captures channel deletion confirmation from ui
   *
   */
  confirmChannelDeletion() {
    this.topicChannelService
      .deleteChannel(this.selectedChannel)
      .subscribe((res) => {
        if ('success' in res) {
          // this.showInfo(res['success']);
          this.showInfo('Channel successfully deleted!');
          this.router.navigate([
            'course',
            this.courseService.getSelectedCourse()._id,
          ]);
          this.store.dispatch(
            CourseActions.SetSelectedChannel({ selectedChannel: null })
          );
          this.store.dispatch(
            CourseActions.toggleChannelSelected({ channelSelected: false })
          );
        } else {
          this.showError(res['errorMsg']);
        }
      });
  }

  onRenameChannel() {
    let selectedChnl = <HTMLInputElement>(
      document.getElementById(`${this.selectedChannel._id}`)
    );
    selectedChnl.contentEditable = 'true';
    this.selectElementContents(selectedChnl);
    this.selectedIdCh = this.selectedChannel._id;
    this.previousChannel = this.selectedChannel;
    this.insertedText = '';
  }
  onRenameConfirmedChannel(id) {
    const channelId = id;
    this.textFromChannel = false;
    if (this.enterKey) {
      //confirmed by keyboard
      let ChannelName = this.previousChannel.name;
      const channelDescription = this.previousChannel.description;
      let body = { name: ChannelName, description: channelDescription };
      let newChannelName = this.insertedText;
      if (newChannelName.charAt(0) === '#') {
        newChannelName = newChannelName.substring(1); // to remove the additional hash
      }
      newChannelName = newChannelName.replace(/(\r\n|\n|\r)/gm, ''); //remove newlines
      //console.log(newChannelName);
      if (newChannelName && newChannelName !== '') {
        body = {
          name: newChannelName,
          description: channelDescription, //keep description value
        };
      }
      this.enterKey = false;
      this.topicChannelService
        .renameChannel(this.previousChannel, channelId, body)
        .subscribe();
      this.selectedChannel.name = body.name;
      this.selectedChannel.description = body.description;
    } else if (this.escapeKey === true) {
      //ESC pressed
      //  console.log('ESC Pressed');
      this.escapeKey = false;
    } else {
      //confirmed by mouse click
      //console.log('logged from mouse');
      let ChannelName = this.previousChannel.name;
      const channelDescription = this.previousChannel.description;
      let body = { name: ChannelName, description: channelDescription };
      let newChannelName = this.insertedText;
      if (newChannelName.charAt(0) === '#') {
        newChannelName = newChannelName.substring(1); // to remove the additional hash
      }
      newChannelName = newChannelName.replace(/(\r\n|\n|\r)/gm, ''); //remove newlines
      //console.log(newChannelName);
      if (
        newChannelName &&
        newChannelName !== '' &&
        newChannelName !== this.previousChannel.name &&
        /\s/g.test(newChannelName)
      ) {
        body = {
          name: newChannelName,
          description: channelDescription, //keep description value
        };
      } else if (!/\s/g.test(newChannelName)) {
        (<HTMLInputElement>document.getElementById(id)).innerText =
          this.previousChannel.name;
      }
      this.editable = false;
      this.topicChannelService
        .renameChannel(this.previousChannel, channelId, body)
        .subscribe();
      this.selectedChannel.name = body.name;
      this.selectedChannel.description = body.description;
    }
  }
  onTextInsertedChannel(id, e) {
    //Prevent Special keys
    this.editable = true;
    this.textFromChannel = true;
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
          this.onRenameConfirmedChannel(id);
        } else if (!/\s/g.test(inText)) {
          this.showError('Channel name field is empty');
        } //name is null or white space(s)
      } else if (e.keyCode === 27) {
        // on ESC pressed
        (<HTMLInputElement>document.getElementById(id)).contentEditable =
          'false';
        this.insertedText = this.selectedChannel.name;
        window.getSelection().removeAllRanges(); // deselect text on confirm
        this.escapeKey = true;
        (<HTMLInputElement>document.getElementById(id)).innerText =
          this.previousChannel.name;
        this.onRenameConfirmedChannel(id);
      }
    } else if (e.keyCode === 13) {
      /**if text is not selected check following cases */
      // on Enter pressed
      (<HTMLInputElement>document.getElementById(id)).contentEditable = 'false';
      window.getSelection().removeAllRanges(); // deselect text on confirm
      this.enterKey = true;
      this.onRenameConfirmedChannel(id);
    } else if (e.keyCode === 27) {
      // on ESC pressed
      (<HTMLInputElement>document.getElementById(id)).contentEditable = 'false';
      this.insertedText = this.selectedChannel.name;
      window.getSelection().removeAllRanges(); // deselect text on confirm
      this.escapeKey = true;
      (<HTMLInputElement>document.getElementById(id)).innerText =
        this.previousChannel.name;
      this.onRenameConfirmedChannel(id);
    }
  }
  afterTextInsertedChennel(id, e) {
    //ccheck on button release | get inner text as long as it's inserted
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
   * @function onAddNewChannelClicked
   * Captures the action when user clicks on add new channel
   *
   */
  onAddNewChannelClicked(topic: Topic) {
    this.topicChannelService.selectTopic(topic);
    this.toggleAddNewChannelClicked(true);
  }

  /**
   * @function toggleAddNewChannelClicked
   * toggle the popup of adding new channel
   *
   */
  toggleAddNewChannelClicked(visibility) {
    this.displayAddChannelDialogue = visibility;
  }

  selectElementContents(el) {
    // select text on rename
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  topicMenuButtonClicked($event, topic: Topic) {
    this.selectedTopic = topic;
    this.topicMenu.toggle($event);
    this.topicIdOfTopicMenuClicked = topic._id;
    this.store.dispatch(
      CourseActions.setLastTopicMenuClicked({
        lastTopicMenuClickedId: topic._id,
      })
    );
    console.log(topic);
  }

  channelMenuButtonClicked($event, channel: Channel) {
    console.log('channel Menu button clicked!');
    this.selectedChannel = channel;
    this.channelMenu.toggle($event);
    this.channelIdOfChannelMenuClicked = channel._id;
    this.store.dispatch(
      CourseActions.setLastChannelMenuClicked({
        lastChannelMenuClickedId: channel._id,
      })
    );
    console.log(channel);
  }

  onTopicNotificationSettingsClicked(notificationOption: {
    label: string;
    control: FormControl<boolean>;
  }): void {
    console.log('The control clicked is: ');
    console.log(notificationOption.label);

    //toggle the value of the control
    /*      notificationOption.control.setValue(!notificationOption.control.value); */
    const labelClicked: string = notificationOption.label;
    let objToSend = {
      topicId: this.topicIdOfTopicMenuClicked,
      courseId: this.selectedCourseId,

      [topicNotificationSettingLabels.annotations]:
        labelClicked === topicNotificationSettingLabels.annotations
          ? !this.checkBoxesGroup.value[
              topicNotificationSettingLabels.annotations
            ]
          : this.checkBoxesGroup.value[
              topicNotificationSettingLabels.annotations
            ],
      [topicNotificationSettingLabels.commentsAndMentioned]:
        labelClicked === topicNotificationSettingLabels.commentsAndMentioned
          ? !this.checkBoxesGroup.value[
              topicNotificationSettingLabels.commentsAndMentioned
            ]
          : this.checkBoxesGroup.value[
              topicNotificationSettingLabels.commentsAndMentioned
            ],
      [topicNotificationSettingLabels.topicUpdates]:
        labelClicked === topicNotificationSettingLabels.topicUpdates
          ? !this.checkBoxesGroup.value[
              topicNotificationSettingLabels.topicUpdates
            ]
          : this.checkBoxesGroup.value[
              topicNotificationSettingLabels.topicUpdates
            ],
    };

    this.store.dispatch(
      CourseActions.setTopicNotificationSettings({ settings: objToSend })
    );
  }

  onChannelNotificationSettingsClicked(notificationOption: {
    label: string;
    control: FormControl<boolean>;
  }): void {
    console.log('The control clicked is: ');
    console.log(notificationOption.label);

    const labelClicked: string = notificationOption.label;
    let objToSend = {
      channelId: this.channelIdOfChannelMenuClicked,
      courseId: this.selectedCourseId,

      [channelNotificationSettingLabels.annotations]:
        labelClicked === channelNotificationSettingLabels.annotations
          ? !this.channelCheckBoxesGroup.value[
              channelNotificationSettingLabels.annotations
            ]
          : this.channelCheckBoxesGroup.value[
              channelNotificationSettingLabels.annotations
            ],
      [channelNotificationSettingLabels.commentsAndMentioned]:
        labelClicked === channelNotificationSettingLabels.commentsAndMentioned
          ? !this.channelCheckBoxesGroup.value[
              channelNotificationSettingLabels.commentsAndMentioned
            ]
          : this.channelCheckBoxesGroup.value[
              channelNotificationSettingLabels.commentsAndMentioned
            ],
      [channelNotificationSettingLabels.channelUpdates]:
        labelClicked === channelNotificationSettingLabels.channelUpdates
          ? !this.channelCheckBoxesGroup.value[
              channelNotificationSettingLabels.channelUpdates
            ]
          : this.channelCheckBoxesGroup.value[
              channelNotificationSettingLabels.channelUpdates
            ],
    };

    this.store.dispatch(
      CourseActions.setChannelNotificationSettings({ settings: objToSend })
    );
  }

  onResetTopicNotificationsClicked() {
    console.log('value is false');
    this.store.dispatch(
      CourseActions.unsetTopicNotificationSettings({
        settings: {
          topicId: this.topicIdOfTopicMenuClicked,
          courseId: this.selectedCourseId,
        },
      })
    );
  }
  onResetChannelNotificationsClicked() {
    this.store.dispatch(
      CourseActions.unsetChannelNotificationSettings({
        settings: {
          channelId: this.channelIdOfChannelMenuClicked,
          courseId: this.selectedCourseId,
        },
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
      severity: 'info',
      summary: 'Success',
      detail: msg,
    });
  }
  /**
   * @function showError
   * shows the user if his action failed
   *
   */
  showError(msg) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
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
