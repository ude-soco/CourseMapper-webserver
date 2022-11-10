import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Channel } from 'src/app/models/Channel';
import { Topic } from 'src/app/models/Topic';
import { CourseService } from 'src/app/services/course.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { MessageService } from 'primeng/api';
import { NotificationServiceService } from 'src/app/services/notification-service.service';
import { Notification } from 'src/app/model/notification-item';
import { MaterialsService } from 'src/app/services/materials.service';
import { AnnotationService } from 'src/app/services/annotation.service';
import { StorageService } from 'src/app/services/storage.service';
@Component({
  selector: 'app-topic-dropdown',
  templateUrl: './topic-dropdown.component.html',
  styleUrls: ['./topic-dropdown.component.css'],
  providers: [MessageService],
})
export class TopicDropdownComponent implements OnInit {
  channelNotifications: Notification[];
  courseNotifications: Notification[];
  @Input() activeChannel: string;
  topics: Topic[] = [];
  displayAddChannelDialogue: boolean = false;
  selectedTopic = null;
  selectedChannel = null;
  courseId: string;
  userId: string;
  visitedChannel: string[] = [];
  highlightAnnotationLists: string[] = [];
  constructor(
    private courseService: CourseService,
    private topicChannelService: TopicChannelService,
    private messageService: MessageService,
    public notificationService: NotificationServiceService,
    private materialService: MaterialsService,
    private annotationService: AnnotationService,
    private storageService: StorageService
  ) {}

  topicOptions: MenuItem[] = [
    {
      label: 'Options',
      items: [
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
      ],
    },
  ];
  channelsOptions: MenuItem[] = [
    {
      label: 'Options',
      items: [
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
      ],
    },
  ];

  ngOnInit(): void {
    this.topicChannelService
      .fetchTopics(this.courseService.getSelectedCourse()._id)
      .subscribe((topics) => {
        this.topics = topics;
      });
    this.topicChannelService.onUpdateTopics$.subscribe(
      (topics) => (this.topics = topics)
    );

    this.topicChannelService.activeLocation$.subscribe((location) => {
      this.activeChannel = location.channelId;
    });
    this.courseId = this.courseService.getSelectedCourse()._id;
    this.getCourseNotifications(this.courseId);

    const user = this.storageService.getUser();
    this.userId = user.id;

    this.topicChannelService.visitedChannel$.subscribe((visitedChannel) => {
      this.visitedChannel = visitedChannel;
    });
  }

  getCourseNotifications(courseId) {
    this.notificationService
      .getCourseNotification(courseId)
      .subscribe((res: any) => {
        this.courseNotifications = res.courseNotifications.flat();
      });
  }

  showMenu() {
    console.log(this.selectedTopic);
  }

  onSelectTopic(topic: Topic) {
    alert(`onTopicSelect ${topic._id}`);
    console.log('topic on selected', this.topics);
  }
  onSelectChannel(channel: Channel) {
    alert(`onChannelSelect ${channel._id}`);
  }

  /**
   * @function onDeleteTopic
   * Captures topic deletion from ui
   *
   */
  onDeleteTopic() {
    this.topicChannelService
      .deleteTopic(this.selectedTopic)
      .subscribe((res) => {
        if ('success' in res) {
          this.showInfo(res['success']);
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

    let topicButton = <HTMLInputElement>(
      document.getElementById(`${this.selectedTopic._id}-button`)
    );
    topicButton.hidden = false;
  }
  onRenameConfirmedTopic(event) {
    let selectedTopic = <HTMLInputElement>document.getElementById(event);
    selectedTopic.contentEditable = 'false';

    let newTopicName = selectedTopic.innerText;
    const body = {
      name: newTopicName,
    };

    let topicButton = <HTMLInputElement>(
      document.getElementById(event + '-button')
    );
    topicButton.hidden = true;

    this.topicChannelService.renameTopic(this.selectedTopic, body).subscribe();
  }

  /**
   * @function onDeleteChannel
   * Captures channel deletion from ui
   *
   */
  onDeleteChannel() {
    this.topicChannelService
      .deleteChannel(this.selectedChannel)
      .subscribe((res) => {
        if ('success' in res) {
          this.showInfo(res['success']);
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

    let channelButton = <HTMLInputElement>(
      document.getElementById(`${this.selectedChannel._id}-button`)
    );
    channelButton.hidden = false;
  }
  onDblClickRenameChannel(event) {
    let selectedChnl = <HTMLInputElement>document.getElementById(event);
    selectedChnl.contentEditable = 'true';
    this.selectElementContents(selectedChnl);

    let channelButton = <HTMLInputElement>(
      document.getElementById(`${event}-button`)
    );
    channelButton.hidden = false;
  }
  onRenameConfirmedChannel(event) {
    const channelId = event;
    let selectedChnl = <HTMLInputElement>document.getElementById(channelId);
    selectedChnl.contentEditable = 'true';
    let newChannelName = selectedChnl.innerText;
    if (newChannelName.charAt(0) === '#') {
      newChannelName = newChannelName.substring(1); // to remove the additional hash
    }
    const body = {
      name: newChannelName,
    };
    let channelButton = <HTMLInputElement>(
      document.getElementById(event + '-button')
    );
    channelButton.hidden = true;
    this.topicChannelService
      .renameChannel(this.selectedChannel, channelId, body)
      .subscribe();
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

  getChannelNotification(channelId: string): { news: number; replies: string } {
    const lastTime = this.notificationService.getLoggedInTime();
    let newLists = [];
    let old = [];
    let temp = [];
    if (lastTime) {
      if (this.courseNotifications) {
        for (let i = 0; i < this.courseNotifications.length; i++) {
          if (
            new Date(this.courseNotifications[i].createdAt).getTime() > lastTime
          ) {
            newLists.push(this.courseNotifications[i]);
          } else {
            old.push(this.courseNotifications[i]);
          }
        }
      }
    }
    temp = newLists.filter((news: Notification) => {
      return news.channelId == channelId;
    });
    let replies: any;
    replies = temp.filter((news: Notification) => {
      return (
        news.type == 'mentionedandreplied' && news.replyBelongsTo == this.userId
      );
    });
    return { news: temp.length, replies: replies };
  }

  selectChannel(channelId: string, courseId: string) {
    const activeChannel = {
      channelId: channelId,
      courseId: courseId,
    };
    this.materialService.selectedChannel.next(activeChannel);

    if (!this.visitedChannel.includes(channelId)) {
      this.visitedChannel.push(channelId);
    }

    this.topicChannelService.visitedChannel.next(this.visitedChannel);
  }

  handleHighlight(replies: any) {
    let temp = [];
    replies.forEach((reply) => {
      temp.push(reply.annotationId);
    });
    this.annotationService.highlightAnnotations.next(temp);
  }
}
