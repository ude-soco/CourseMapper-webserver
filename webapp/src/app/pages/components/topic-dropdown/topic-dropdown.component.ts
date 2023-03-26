import {
  Component,
  EventEmitter,
  OnInit,
  HostListener,
  Input,
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
import * as MaterialActions from 'src/app/pages/components/materils/state/materials.actions';
import { State } from '../materils/state/materials.reducer';

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
    private route: ActivatedRoute
  ) {}
  @Input() showModeratorPrivileges: boolean;

  topics: Topic[] = [];
  displayAddChannelDialogue: boolean = false;
  selectedTopic = null;
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
  expandTopic = null;

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

  ngOnInit(): void {
    this.topicChannelService
      .fetchTopics(this.courseService.getSelectedCourse()._id)
      .subscribe((topics) => (this.topics = topics));
    this.topicChannelService.onUpdateTopics$.subscribe(
      (topics) => (this.topics = topics)
    );
  }

  ngOnDestroy() {
    this.expandTopic = null;
    this.selectedChannelId=null
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

  showMenu() {
    console.log(this.selectedTopic);
  }

  onSelectTopic(topic: Topic) {
    if (this.expandTopic === topic._id) {
      this.expandTopic = null;
    } else {
      this.expandTopic = topic._id;
    }
  }
  onSelectChannel(channel: Channel) {
    //console.log(channel.materials);
    //3
    this.topicChannelService.selectChannel(channel);
    this.router.navigate([
      'course',
      this.courseService.getSelectedCourse()._id,
      'channel',
      channel._id,
    ]);
    this.store.dispatch(
      MaterialActions.toggleChannelSelected({ channelSelected: true })
    );
    // make selected channel's background white
    this.selectedChannelId=channel._id
    
    // make all channels' container background Null
    this.topics.forEach((topic)=>{
      topic.channels.forEach((channelEle)=>{
        var nonSelectedChannels=document.getElementById(channelEle._id+'-container');
        nonSelectedChannels.style.backgroundColor= null
      })
    })
    // make selected channel's container background white
    let channelNameContainer = document.getElementById(channel._id+'-container');
    channelNameContainer.style.backgroundColor='white'
    console.log(channelNameContainer)
  }

  /**
   * @function onDeleteTopic
   * Captures topic deletion from ui
   *
   */
  onDeleteTopic() {
    this.confirmationService.confirm({
      message: 'Do you want to delete this topic?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => this.confirmTopicDeletion(),
      reject: () => this.informUser('info', 'Cancelled', 'Deletion cancelled'),
    });
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
          this.showInfo(res['success']);
          this.router.navigate([
            'course',
            this.courseService.getSelectedCourse()._id,
          ]);
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
      console.log('ESC Pressed');
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
    console.log(e.keyCode);
    console.log(e);
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
      message: 'Do you want to delete this channel?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => this.confirmChannelDeletion(),
      reject: () => this.informUser('info', 'Cancelled', 'Deletion cancelled'),
    });
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
          this.showInfo(res['success']);
          this.router.navigate([
            'course',
            this.courseService.getSelectedCourse()._id,
          ]);
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
      console.log(newChannelName);
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
      console.log('ESC Pressed');
      this.escapeKey = false;
    } else {
      //confirmed by mouse click
      console.log('logged from mouse');
      let ChannelName = this.previousChannel.name;
      const channelDescription = this.previousChannel.description;
      let body = { name: ChannelName, description: channelDescription };
      let newChannelName = this.insertedText;
      if (newChannelName.charAt(0) === '#') {
        newChannelName = newChannelName.substring(1); // to remove the additional hash
      }
      newChannelName = newChannelName.replace(/(\r\n|\n|\r)/gm, ''); //remove newlines
      console.log(newChannelName);
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
