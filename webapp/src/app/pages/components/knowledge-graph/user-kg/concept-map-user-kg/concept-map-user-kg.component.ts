import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  Renderer2,
} from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { Subscription, lastValueFrom, single } from 'rxjs';
import { Channel } from 'src/app/models/Channel';
import { Course } from 'src/app/models/Course';
import { Material } from 'src/app/models/Material';
import { Topic } from 'src/app/models/Topic';
import { User } from 'src/app/models/User';
import { ConceptMapService } from 'src/app/services/concept-map-service.service';
import { KgTabsActivationService } from 'src/app/services/kg-tabs-activation.service';
import { MaterialKgOrderedService } from 'src/app/services/material-kg-ordered.service';
import { MaterialsRecommenderService } from 'src/app/services/materials-recommender.service';
import { Neo4jService } from 'src/app/services/neo4j.service';
import { SlideConceptsService } from 'src/app/services/slide-concepts.service';
import { SlideKgOrderedService } from 'src/app/services/slide-kg-ordered.service';
import { UserKgOrderedService } from 'src/app/services/user-kg-ordered.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { UserConceptsService } from 'src/app/services/user-concepts.service';
import { State, getLoggedInUser } from 'src/app/state/app.reducer';
import { environment } from 'src/environments/environment';
import { getCurrentMaterial } from '../../../materials/state/materials.reducer';
import { getCurrentPdfPage } from '../../../annotations/pdf-annotation/state/annotation.reducer';
import { Socket } from 'ngx-socket-io';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MaterilasService } from 'src/app/services/materials.service';
import { EngagementKgOrderedService } from 'src/app/services/engagement-kg-ordered.service';
import { DNUEngagementKgOrderedService } from 'src/app/services/dnu-engagement-kg-ordered.service';
import { UserServiceService } from 'src/app/services/user-service.service';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';

interface topN {
  name: string;
  code: string;
}

@Component({
  selector: 'app-concept-map-user-kg',
  templateUrl: './concept-map-user-kg.component.html',
  styleUrls: ['./concept-map-user-kg.component.css'],
})
export class ConceptMapUserKgComponent {
  @Input() course?: Course;
  @Input() user?: User;
  @Input() showConceptMap?: boolean;
  @Input() isCmLoading?: boolean;
  @Output() cmShownEvent: EventEmitter<boolean> = new EventEmitter();
  @Output() dataReceivedEvent: EventEmitter<any> = new EventEmitter();
  @Output() loading: EventEmitter<boolean> = new EventEmitter();
  @Output() topConceptsEvent: EventEmitter<any> = new EventEmitter();

  models = [{ label: 'Transformers', value: 'squeezebert/squeezebert-mnli' }];
  topConcepts = [
    { label: '15', value: 15 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: '150', value: 150 },
    { label: '200', value: 200 },
    { label: 'All', value: 'All' },
  ];

  selectedFilterValues?: string[];
  defaultModel = 'squeezebert/squeezebert-mnli';
  defaultTopConcepts = 15;
  selectedTopConcepts?: any;
  selectedModel?: string;
  isLoading?: boolean;
  isNotGenerated?: boolean;
  showConcepts?: boolean; // to show concepts if retrieved
  username: any; //to assign current userName
  userid: any; //to assign current userID
  userFullName: any;
  userEmail: any; //to assign current userEmail
  allConceptsObj = []; //all KG_concaptes
  understoodConceptsObj = []; //object that gets updated on node's status changed
  didNotUnderstandConceptsObj = []; //object that gets updated on node's status changed
  newConceptsObj = []; //object that gets updated on node's status changed
  didNotUnderstandConceptsNames = [];
  finalConceptsToSubmitObj = [];
  cmEndpointURL = environment.API_URL;
  kgCurrentPage = 1;
  submitted = false;
  checkedConcepts = [];
  manuallyAddedConcept = null;
  retrievedConcepts = [];
  kgSlideReceivedResponse = false;
  kgSlideResponseEmpty = false;
  mainConceptsTab = true;
  recommendedConceptsTab = false;
  recommendedMaterialsTab = false;
  flexDivProperty = '33%';
  firstUpdate = false;
  showNotUnderstoodConceptsList = true;
  showCurrentnotUnderstoodConceptsList = true;
  showPreviousnotUnderstoodConceptsList = false;
  conceptFromChipId = null;
  conceptFromChipName = null;
  conceptFromChipObj = null;
  previousConceptFromChipObj = null;
  kgHeight: any;
  selectedCourse: Course;
  selectedTopic: Topic;
  selectedChannel: Channel;
  loggedInUser: User;
  showMaterialKg = false;
  showCourseKg = false;
  showSlideKg = false;
  showUserKg = false;
  showEngagementKg = false;
  showDNUEngagementKg = false;
  kgTabsActivated = false;
  recommendedConcepts = null;
  recommendedMaterials = null;
  currentMaterial?: Material;
  resultMaterials: any;
  concepts1: any;
  concepts2: any;
  model?: string;
  kgNodes = []; //nodes of current material [only cids & names of the concepts]
  previousConcepts: any; //concepts that a user marked previously as understood or not [only cid] || contains 2-arrays: didNotUnderstandConcepts & understoodConcepts
  previousConceptsObj = []; //contains [cids & names] of concepts that [a user did not understand && exist at currentMaterial]
  allUnderstoodConcepts: any[];
  onCloseDialog = false;
  updateUserConcepts = false;
  selectedConceptModel: string;
  selectedMaterialModel: string;
  top_n_nodes: topN[];
  selectedTopN: string;
  showRecommendationButtonClicked = false;
  hideChevronRightButton = false;
  displaySidebarProperty = false;
  badgeMessage: string;
  totalNotUnderstood: number;
  totalNotUnderstoodList: any[];
  previousConverted: any[];
  badgeChanged = false;
  showConceptsListSidebar = true;
  display = true;
  listOfDnuConceptsOnShowRec = []; //copy an image of not_Understood list once show recommendations
  disableShowRecommendationsButton = true;
  slideKgWidth: number;
  selectedOption: any[] = ['val1', 'val2'];
  conceptMapCourse: any;
  conceptMapTopic: any;
  conceptMapChannel: any;
  conceptMapMaterial: any;
  stopCheck: boolean;
  cyHeight: any;
  cyWidth: number;
  kgTitle: string;
  courseKgActivated: boolean = false;
  materialKgActivated: boolean = false;
  userKgActivated: boolean = false;
  engagementKgActivated: boolean = false;
  courseIsEmpty?: boolean = undefined;
  allSelected = false;
  materialIdRedirection: string;
  courseIdRedirection: string;
  redirectionMaterial: Material;
  showDNU: boolean = false;
  showU: boolean = false;

  tabs = [
    {
      label: 'Main Concepts',
      command: (e) => {
        let tempMapData = this.filteredMapData;
        this.filteredMapData = null;
        this.mainConceptsTab = true;
        this.recommendedConceptsTab = false;
        setTimeout(() => {
          this.filteredMapData = tempMapData;
        }, 500);
        //if navigating from recommendedMaterialsTab
        if (this.recommendedMaterialsTab) {
          //show sidebar on main tab
          this.recommendedMaterialsTab = false;
          setTimeout(() => {
            this.showConceptsList();
          }, 50);
        } else {
          //if navigating from another tab keep the last status of sidebar
          this.recommendedMaterialsTab = false;
          if (this.showConceptsListSidebar) {
            setTimeout(() => {
              this.showConceptsList();
            }, 1);
          } else {
            setTimeout(() => {
              this.hideConceptsList();
            }, 1);
          }
        }
      },
    },
    {
      label: 'Recommended Concepts',
      icon: 'pi pi-fw pi-external-link',
      disabled: true,
      command: (e) => {
        this.mainConceptsTab = false;
        this.recommendedConceptsTab = true;
        //if navigating from materials tab
        if (this.recommendedMaterialsTab) {
          this.recommendedMaterialsTab = false;
          //show sidebar on main tab
          setTimeout(() => {
            this.showConceptsList();
          }, 50);
        } else {
          this.recommendedMaterialsTab = false;
          if (this.showConceptsListSidebar) {
            setTimeout(() => {
              this.showConceptsList();
            }, 1);
          } else {
            setTimeout(() => {
              this.hideConceptsList();
            }, 1);
          }
        }
      },
    },
    {
      label: 'Recommended Materials',
      icon: 'pi pi-fw pi-youtube',
      disabled: true,
      command: (e) => {
        this.mainConceptsTab = false;
        this.recommendedConceptsTab = false;
        this.recommendedMaterialsTab = true;
      },
    },
  ];
  tabIndex = 0;

  selectedCheckOptions: any[] = [
    { name: 'Understood and Not Understood Concepts', key: 'main_concept' },
    { name: 'Level of Engagement with Courses', key: 'related_concept' },
    { name: 'Level of Interest in Concepts', key: 'category' },
  ];

  public conceptMapData: any;
  public filteredMapData: any;
  public filterUpdated: boolean = false;
  public conceptMapRecommendedData: any;
  public filteredMapRecData: any;
  public filterRecUpdated: boolean = false;
  public slideKnowledgeGraph: boolean = false;
  public recommenderKnowledgeGraph: boolean = false;

  editConceptForm: FormGroup;
  conceptSearchResults: any = [];
  slideOptions = [];
  conceptInputsDisabled: boolean = false;
  editingConceptId?: string;
  editingConceptName?: string;
  isDraft: boolean = false;
  materialSlides: any;
  docURL: string;
  currentPDFPage: number;

  private subscriptions: Subscription[] = [];
  totalPages: any;
  constructor(
    private messageService: MessageService, //show toast messages
    private conceptMapService: ConceptMapService, //Build material KG
    private materialsRecommenderService: MaterialsRecommenderService, // Get slide's recommendations for KG
    private materialKgGenerator: MaterialKgOrderedService, //Get informed when user asked for Material KG
    private slideKgGenerator: SlideKgOrderedService, //Get informed when user asked for Slide KG
    private kgTabs: KgTabsActivationService, //Enable KG tabs once recommendations arrived
    private slideConceptservice: SlideConceptsService, //Change concepts' status on slide_KG [new, understood, did not understand]
    private userKgGenerator: UserKgOrderedService,
    private engagementKgGenerator: EngagementKgOrderedService,
    private neo4jService: Neo4jService, // communicate to neo4j server
    private userConceptsService: UserConceptsService, //get current user concepts: all previousely marked as [understood, did not understand]
    private topicChannelService: TopicChannelService, // gets channels' detail
    private confirmationService: ConfirmationService,
    private renderer: Renderer2,
    private changeDetectorRef: ChangeDetectorRef, // avoids errors when property changed after being checked
    private store: Store<State>,
    private socket: Socket,
    private materialsService: MaterilasService,
    private dnuengagementKgGenerator: DNUEngagementKgOrderedService,
    private router: Router,
    private userService: UserServiceService
  ) {
    // get current user
    this.subscriptions.push(
      this.store
        .select(getLoggedInUser)
        .subscribe((user) => (this.loggedInUser = user))
    );

    this.subscriptions.push(
      this.kgTabs.activateKgTabs().subscribe(() => {
        this.tabs[1].disabled = false;
        this.tabs[2].disabled = false;
        this.kgTabsActivated = true;
      })
    ); //Activate tabs

    this.subscriptions.push(
      this.userKgGenerator.generateUserKG().subscribe(() => {
        this.showUserKg = false;
        this.showEngagementKg = false;
        this.showDNUEngagementKg = false;

        // Clear the DOM
        this.clearKnowledgeGraphDOM();
        this.conceptMapData = null;
        this.filteredMapData = null;

        setTimeout(() => {
          //reset dropdown value
          this.selectedTopN = null;
          this.selectedTopNodes(15);
          //reset checkboxes values
          this.selectedOption = this.selectedCheckOptions.slice(0, 1);
          this.docURL = undefined;
          //activate users kg & ensure that other views are deactivated
          this.showUserKg = true;
          this.showMaterialKg = false;
          this.showCourseKg = false;
          this.showSlideKg = false;
          this.showEngagementKg = false;
          this.isNotGenerated = undefined;
          this.conceptInputsDisabled = false;
          setTimeout(() => {
            this.getConceptMapData();
          }, 10);
        }, 0);
      })
    ); // show user kg

    this.subscriptions.push(
      this.engagementKgGenerator.generateEngagementKG().subscribe(() => {
        this.showUserKg = false;
        this.showEngagementKg = false;
        this.showDNUEngagementKg = false;

        // Clear the DOM
        this.clearKnowledgeGraphDOM();
        this.conceptMapData = null;
        this.filteredMapData = null;

        setTimeout(() => {
          //reset dropdown value
          this.selectedTopN = null;
          this.selectedTopNodes(15);
          //reset checkboxes values
          this.selectedOption = this.selectedCheckOptions.slice(0, 1);
          this.docURL = undefined;
          //activate users kg & ensure that other views are deactivated
          this.showUserKg = false;
          this.showEngagementKg = true;
          this.showMaterialKg = false;
          this.showCourseKg = false;
          this.showSlideKg = false;
          this.isNotGenerated = undefined;
          this.conceptInputsDisabled = false;
          setTimeout(() => {
            this.getConceptMapData();
          }, 10);
        }, 0);
      })
    ); // show engagement kg

    this.subscriptions.push(
      this.dnuengagementKgGenerator.generateDNUEngagementKG().subscribe(() => {
        this.showUserKg = false;
        this.showEngagementKg = false;
        this.showDNUEngagementKg = false;

        // Clear the DOM
        this.clearKnowledgeGraphDOM();
        this.conceptMapData = null;
        this.filteredMapData = null;

        setTimeout(() => {
          //reset dropdown value
          this.selectedTopN = null;
          this.selectedTopNodes(15);
          //reset checkboxes values
          this.selectedOption = this.selectedCheckOptions.slice(0, 1);
          this.docURL = undefined;
          //activate users kg & ensure that other views are deactivated
          this.showUserKg = false;
          this.showEngagementKg = false;
          this.showMaterialKg = false;
          this.showCourseKg = false;
          this.showSlideKg = false;
          this.showDNUEngagementKg = true;
          this.isNotGenerated = undefined;
          this.conceptInputsDisabled = false;
          setTimeout(() => {
            this.getConceptMapData();
          }, 10);
        }, 0);
      })
    ); // show dnu engagement kg
    this.top_n_nodes = [
      { name: '15', code: '15' },
      { name: '25', code: '25' },
      { name: '50', code: '50' },
      { name: '100', code: '100' },
      { name: '150', code: '150' },
      { name: '200', code: '200' },
      { name: 'All', code: 'All' },
    ];
  }
  chipMenu: MenuItem[];
  chipMenuPrevious: MenuItem[];

  printLogMessage(data: any) {
    console.log('Log message', data);
  }

  private clearKnowledgeGraphDOM() {
    // Clear any existing graph elements
    const graphContainer = document.getElementById('cy');
    if (graphContainer) {
      // Clear the container's contents
      graphContainer.innerHTML = '';
    }
  }

  onDNUChange() {
    if (this.showDNU) {
      this.showU = false;
    }
  }

  onUChange() {
    if (this.showU) {
      this.showDNU = false;
    }
  }

  ngOnDestroy(): void {
    this.conceptMapData = undefined;
    this.loading.emit(this.isLoading);
    this.socket.off('log', [this.printLogMessage]);

    for (let subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }
  ngOnChanges() {
    if (this.course) {
      this.selectedCourse = this.course;
    }
    if (this.isCmLoading) {
      this.isLoading = this.isCmLoading;
    } else {
      this.isLoading = false;
    }

    this.filterUpdated = false;
    this.conceptMapData = undefined;
    this.filteredMapData = undefined;
    this.defaultModel = 'squeezebert/squeezebert-mnli';
    this.selectedModel = this.defaultModel;

    this.selectedTopConcepts = this.defaultTopConcepts;
    this.defaultTopConcepts = 15;
  }
  ngOnInit() {
    this.socket.on('log', this.printLogMessage);

    if (this.loggedInUser) {
      this.userid = this.loggedInUser.id;
      this.username = this.loggedInUser.username;
      this.userEmail = this.loggedInUser.email;
    }
    if (this.userid) {
      this.userService.GetUserName(this.userid).subscribe({
        next: (userData) => {
          this.userFullName = userData.firstname + ' ' + userData.lastname;
        },
        error: (error) => {
          console.error('Error fetching user data:', error);
        },
      });
    }
    this.chipMenu = [
      {
        label: 'Mark as understood',
        icon: 'pi pi-check',
        command: (e) => {
          //if marked previously as Not_understood, update the list
          this.previousConceptsObj = this.previousConceptsObj.filter(
            (concept) => concept.cid !== this.conceptFromChipObj.cid
          );
          this.previousConcepts.didNotUnderstandConcepts =
            this.previousConcepts.didNotUnderstandConcepts.filter(
              (concept) => concept !== this.conceptFromChipObj.cid
            );
          this.slideConceptservice.updateUnderstoodConcepts(
            this.conceptFromChipObj
          );
          this.conceptFromChipObj = null;
        },
      },
      {
        label: 'Revert to new',
        icon: 'pi pi-replay',
        command: (e) => {
          this.previousConceptsObj = this.previousConceptsObj.filter(
            (concept) => concept.cid !== this.conceptFromChipObj.cid
          );
          this.previousConcepts.didNotUnderstandConcepts =
            this.previousConcepts.didNotUnderstandConcepts.filter(
              (concept) => concept !== this.conceptFromChipObj.cid
            );
          this.slideConceptservice.updateNewConcepts(this.conceptFromChipObj);
          this.conceptFromChipObj = null;
        },
      },
    ];
    this.chipMenuPrevious = [
      {
        label: 'Mark as understood',
        icon: 'pi pi-check',
        command: (e) => {
          this.previousConcepts.didNotUnderstandConcepts =
            this.previousConcepts.didNotUnderstandConcepts.filter(
              (concept) => concept !== this.previousConceptFromChipObj.cid
            );
          this.slideConceptservice.updateUnderstoodConcepts(
            this.previousConceptFromChipObj
          );
          this.previousConceptFromChipObj = null;
        },
      },
      {
        label: 'Revert to new',
        icon: 'pi pi-replay',
        command: (e) => {
          this.previousConcepts.didNotUnderstandConcepts =
            this.previousConcepts.didNotUnderstandConcepts.filter(
              (concept) => concept !== this.previousConceptFromChipObj.cid
            );
          this.slideConceptservice.updateNewConcepts(
            this.previousConceptFromChipObj
          );
          this.previousConceptFromChipObj = null;
        },
      },
    ];

    this.selectedOption = this.selectedCheckOptions.slice(0, 1);

    this.editConceptForm = new FormGroup({
      conceptName: new FormControl(null),
      conceptSlides: new FormControl(null),
    });
  }

  ngAfterViewChecked() {
    if (
      this.showMaterialKg ||
      this.showCourseKg ||
      (this.mainConceptsTab && this.kgSlideReceivedResponse)
    ) {
      this.cyHeight = window.innerHeight * 0.9 - 270;
      this.cyWidth = window.innerWidth * 0.9;
      this.changeDetectorRef.detectChanges();
    }
    if (this.showSlideKg) {
      let accTab1 = document.getElementById('accordionTab1');
      let accTab2 = document.getElementById('accordionTab2');
      if (accTab1 && accTab2) {
        let accordionTab1 = document.getElementById('accordionTab1')
          .childNodes[0].childNodes[0].childNodes[0] as HTMLElement;
        let accordionTab2 = document.getElementById('accordionTab2')
          .childNodes[0].childNodes[0].childNodes[0] as HTMLElement;
        if (accordionTab1) {
          accordionTab1.style.backgroundColor = '#e9ecef';
          accordionTab1.style.color = '#747d84';
        }
        if (accordionTab2) {
          accordionTab2.style.backgroundColor = '#e9ecef';
          accordionTab2.style.color = '#747d84';
        }
      }

      let dnuPanel = document.getElementById('flexboxNotUnderstood');
      if (dnuPanel) {
        let sideBarComponent = dnuPanel.childNodes[0].childNodes[0]
          .childNodes[1] as HTMLElement;
        const previousConcepts = document.getElementById('previousConcepts');
        const currentConcepts = document.getElementById('currentConcepts');
        if (sideBarComponent.clientHeight >= this.cyHeight - 100) {
          if (previousConcepts) {
            document.getElementById('previousConcepts').style.height =
              Number(this.cyHeight * 0.2).toString() + 'px';
            document.getElementById('previousConcepts').style.overflowY =
              'auto';
            document.getElementById('previousConcepts').style.maxHeight =
              'max-content';
            if (sideBarComponent.clientHeight >= this.cyHeight - 100) {
              document.getElementById('previousConcepts').style.height =
                Number(this.cyHeight * 0.18).toString() + 'px';
            } else {
              document.getElementById('previousConcepts').style.height =
                Number(this.cyHeight * 0.8).toString() + 'px';
            }
          }
          if (currentConcepts) {
            if (sideBarComponent.clientHeight >= this.cyHeight - 100) {
              document.getElementById('currentConcepts').style.maxHeight =
                Number(this.cyHeight * 0.35).toString() + 'px';
              document.getElementById('currentConcepts').style.overflowY =
                'scroll';
            } else {
              document.getElementById('currentConcepts').style.overflowY =
                'auto';
            }
          }
        } else {
          if (previousConcepts) {
            document.getElementById('previousConcepts').style.maxHeight =
              Number(this.cyHeight * 0.8).toString() + 'px';
            document.getElementById('previousConcepts').style.overflowY =
              'scroll';
          }
        }
      }
    }

    if (!this.showSlideKg && this.updateUserConcepts) {
      this.onSubmitCancel();
    }

    if (this.materialKgActivated && !this.showMaterialKg) {
      this.materialKgActivated = false;
    }
  }

  onResize(e) {
    if (this.showSlideKg) {
      try {
        if (this.showConceptsListSidebar) {
          this.showConceptsList();
        } else {
          this.hideConceptsList();
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (this.showMaterialKg) {
      this.cyHeight = window.innerHeight * 0.9 - 270;
      this.stopCheck = true;
      this.changeDetectorRef.detectChanges();
    }
    this.cyWidth = window.innerWidth * 0.9;
    if (this.showUserKg || this.showEngagementKg || this.showDNUEngagementKg) {
      // this.cyWidth = window.innerWidth * 0.9 - 270;
      this.cyHeight = window.innerHeight * 0.9 - 270;
      const container = document.querySelector(
        '.knowledge-graph-container'
      ) as HTMLElement;
      if (!container) return;
      container.style.width = '120%';
      container.style.maxWidth = '120%';

      const header = document.querySelector('.kg-header') as HTMLElement;
      if (header) {
        header.style.width = '120%';
        header.style.maxWidth = '120%';
      }
      this.stopCheck = true;
      this.changeDetectorRef.detectChanges();
    }
  }

  setChipConcept(concept: any): void {
    this.conceptFromChipObj = {
      id: concept.id,
      cid: concept.cid,
      name: concept.name,
      status: concept.status === 'understood' ? 'notUnderstood' : 'understood',
    };
  }
  setPreviousChipConcept(concept: any): void {
    this.previousConceptFromChipObj = {
      cid: concept.cid,
      name: concept.name,
    };
  }

  // show/hide lists of current slide concepts and\ or other slides concepts
  showConceptsList() {
    this.showConceptsListSidebar = true;
    this.hideChevronRightButton = true;
    this.showNotUnderstoodConceptsList = true;

    let knowledgeGraph = document.getElementById('graphSection');
    var slideKgDialogDiv = document.getElementById('slideKgDialogDiv');

    setTimeout(() => {
      var flexboxNotUnderstood = document.getElementById(
        'flexboxNotUnderstood'
      );
      if (flexboxNotUnderstood) {
        this.slideKgWidth =
          slideKgDialogDiv.offsetWidth - flexboxNotUnderstood.offsetWidth;
        knowledgeGraph.style.marginLeft = 1 + 'rem';
      } else {
        this.slideKgWidth = slideKgDialogDiv.offsetWidth;
      }
      knowledgeGraph.style.width = this.slideKgWidth + 'px';
    }, 2);
  }
  // hide sidebar
  hideConceptsList() {
    this.showNotUnderstoodConceptsList = false;
    this.hideChevronRightButton = false;
    let knowledgeGraph = document.getElementById('graphSection');
    var slideKgDialogDiv = document.getElementById('slideKgDialogDiv');
    setTimeout(() => {
      knowledgeGraph.style.marginLeft = 0 + 'rem';
      knowledgeGraph.style.width = slideKgDialogDiv.offsetWidth + 'px';
    }, 2);
  }

  async getConceptMapData() {
    this.clearKnowledgeGraphDOM();
    if (this.showUserKg) {
      console.log('concept map data fetched');
      var startTime = performance.now();
      this.isNotGenerated = false;
      try {
        let kgNodes = [];
        let kgEdges = [];
        const userNode = await this.neo4jService.getUser(this.userid); // add user with no r or c
        const singleUserNode = await this.neo4jService.getSingleUser(
          this.userid
        );
        const courseNode = await this.neo4jService.getLevelofEngagement(
          this.userid
        ); // to check if user is enrolled in courses
        console.log(userNode);
        // console.log(this.userFullName);
        if (userNode.records.length !== 0 && courseNode.records.length !== 0) {
          let data = userNode.records;
          var userNodeEle = {
            id: data[0].u.identity.toString(),
            uid: data[0].u.properties.uid,
            type: data[0].u.properties.type,
            name: this.userFullName,
          };
          kgNodes.push(userNodeEle);
          userNode.records.forEach((data) => {
            var conceptNodeEle = {
              id: data.c.identity.toString(),
              name: data.c.properties.name,
              cid: data.c.properties.cid,
              uri: data.c.properties.uri,
              type: data.c.properties.type,
              mid: data.c.properties.mid,
              weight: data.c.properties.weight,
              wikipedia: data.c.properties.wikipedia,
              abstract: data.c.properties.abstract,
              isDeleted: data.c.properties?.isDeleted,
            };
            kgNodes.push(conceptNodeEle);
          });
          for (let i = kgNodes.length - 1; i >= 1; i--) {
            // make sure user is enrolled in course
            const hasConcept = await this.neo4jService.getHasConcept(
              kgNodes[i].id
            );
            //console.log(hasConcept);
            if (hasConcept.records.length === 0) {
              kgNodes.splice(i, 1);
            }
          }
          userNode.records.forEach((data) => {
            var edgeEle = {
              type: data.r.type,
              id: data.r.identity.toString(),
              source: data.r.start.toString(),
              target: data.r.end.toString(),
            };
            kgEdges.push(edgeEle);
          });
          const relatedConcepts = [];
          for (const data of kgNodes) {
            if (data.type === 'main_concept') {
              try {
                relatedConcepts.push(
                  await this.neo4jService.getRelatedTo(data.cid)
                );
              } catch (error) {
                console.error('Error getting related concepts:', error);
              }
            }
          }
          console.log(relatedConcepts);
          relatedConcepts.forEach((result) => {
            if (result.records && result.records.length > 0) {
              result.records.forEach((data) => {
                if (data.r) {
                  var relatedEdgeEle = {
                    type: data.r.type,
                    id: data.r.identity.toString(),
                    source: data.r.start.toString(),
                    target: data.r.end.toString(),
                  };
                  kgEdges.push(relatedEdgeEle);
                }
                if (data.target) {
                  var relatedConceptEle = {
                    id: data.target.identity.toString(),
                    name: data.target.properties.name,
                    cid: data.target.properties.cid,
                    uri: data.target.properties.uri,
                    type: data.target.properties.type,
                    mid: data.target.properties.mid,
                    weight: data.target.properties.weight,
                    wikipedia: data.target.properties.wikipedia,
                    abstract: data.target.properties.abstract,
                  };
                  kgNodes.push(relatedConceptEle);
                }
              });
            }
          });
          const categories = [];
          for (const data of kgNodes) {
            if (data.type === 'main_concept') {
              try {
                categories.push(
                  await this.neo4jService.getHasCategory(data.cid)
                );
              } catch (error) {
                console.error('Error getting category concepts:', error);
              }
            }
          }
          console.log(categories);
          categories.forEach((result) => {
            if (result.records && result.records.length > 0) {
              result.records.forEach((data) => {
                if (data.r) {
                  var categoryEdgeEle = {
                    type: data.r.type,
                    id: data.r.identity.toString(),
                    source: data.r.start.toString(),
                    target: data.r.end.toString(),
                  };
                  kgEdges.push(categoryEdgeEle);
                }
                if (data.target) {
                  var categoryConceptEle = {
                    id: data.target.identity.toString(),
                    name: data.target.properties.name,
                    cid: data.target.properties.cid,
                    uri: data.target.properties.uri,
                    type: data.target.properties.type,
                    mid: data.target.properties.mid,
                    weight: data.target.properties.weight,
                    wikipedia: data.target.properties.wikipedia,
                    abstract: data.target.properties.abstract,
                  };
                  kgNodes.push(categoryConceptEle);
                }
              });
            }
          });
        } else if (singleUserNode.records.length !== 0) {
          console.log(singleUserNode);
          let data = singleUserNode.records;
          var userNodeEle = {
            id: data[0].u.identity.toString(),
            uid: data[0].u.properties.uid,
            type: data[0].u.properties.type,
            name: this.userFullName,
          };
          kgNodes.push(userNodeEle);
        } else {
          this.noUserNodeMessage();
        }
        const nodes = [];
        const edges = [];
        kgNodes.forEach((data) => {
          let node = { data };
          nodes.push(node);
        });
        kgEdges.forEach((data) => {
          let edge = { data };
          edges.push(edge);
        });
        let userKgMeta = {
          nodes: nodes,
          edges: edges,
        };
        console.log('conceptMapMaterial', userKgMeta);
        console.log('concepMapMaterialNode', userKgMeta.nodes);
        this.conceptMapMaterial = userKgMeta;
        this.conceptMapData = userKgMeta;

        //filter edges with no weights, or/and slide's edges
        // the edges aren't filtered completely from the first iteration, so it will keep checking until all have been filtered
        var counter = 1;
        while (counter) {
          var counter = 0;
          this.conceptMapData.edges.forEach((edge, index) => {
            if (edge.data.weight === null) {
              this.conceptMapData.edges.splice(index, 1);
              counter++;
            }
          });
        }
        /*
        //extract node's weight & filter undefined weights
        let weightsArray = [];
        this.conceptMapData.nodes.forEach((node) => {
          if (node.data.weight) {
            weightsArray.push(node.data.weight);
          }
        });

        //get min & max weight
        var maxWeight = Math.max(...weightsArray).toString();
        var minWeight = Math.min(...weightsArray).toString();

        //assign min & max weights to each node to be normalized later
        this.conceptMapData.nodes.forEach((node) => {
          node.data.maxWeight = maxWeight;
          node.data.minWeight = minWeight;
        });*/
        console.log(kgNodes);

        this.selectedFilterValues = ['main_concept'];
        this.filteredMapData = this.conceptMapData;
        this.dataReceivedEvent.emit(this.conceptMapData);
        this.isLoading = false;
        this.loading.emit(false);
        /*if (this.conceptMapData) {
          let matKgControlPanel = document.getElementById(
            'materialKgControlPanel'
          );
          this.renderer.removeClass(matKgControlPanel, 'noContentRecieved');
          matKgControlPanel.style.float = 'right';
        }*/
        var endTime = performance.now();
        console.log(
          `Call to show User_KG took ${endTime - startTime} milliseconds`
        );
      } catch (error) {
        if (error?.status === 404 || error?.status === 403) {
          this.isNotGenerated = true;
        }
        console.error('Error constructing kg', error);
        this.isLoading = false;
        this.loading.emit(false);
      }
    } else if (this.showEngagementKg) {
      console.log('concept map data fetched');
      var startTime = performance.now();
      this.isNotGenerated = false;
      try {
        let kgNodes = [];
        let kgEdges = [];
        const userNode = await this.neo4jService.getLevelofEngagement(
          this.userid
        ); // add user with no r or c
        console.log(userNode);
        if (userNode.records.length !== 0) {
          let data = userNode.records;
          var userNodeEle = {
            id: data[0].u.identity.toString(),
            uid: data[0].u.properties.uid,
            type: data[0].u.properties.type,
            name: this.userFullName,
          };
          kgNodes.push(userNodeEle);
          userNode.records.forEach((data) => {
            var courseNodeEle = {
              id: data.target.identity.toString(),
              name: data.target.properties.name
                ? data.target.properties.name
                : data.target.labels[0],
              cid: data.target.properties.cid,
              type: data.target.labels[0],
            };
            kgNodes.push(courseNodeEle);
          });
          userNode.records.forEach((data) => {
            var edgeEle = {
              type: data.r.type,
              id: data.r.identity.toString(),
              source: data.r.start,
              target: data.r.end,
              level: data.r.properties.level,
            };
            kgEdges.push(edgeEle);
          });
        } else {
          const singleUserNode = await this.neo4jService.getSingleUser(
            this.userid
          );
          console.log(singleUserNode);
          let data = singleUserNode.records;
          var userNodeEle = {
            id: data[0].u.identity.toString(),
            uid: data[0].u.properties.uid,
            type: data[0].u.properties.type,
            name: this.userFullName,
          };
          kgNodes.push(userNodeEle);
        }
        const nodes = [];
        const edges = [];
        kgNodes.forEach((data) => {
          let node = { data };
          nodes.push(node);
        });
        kgEdges.forEach((data) => {
          let edge = { data };
          edges.push(edge);
        });
        let userKgMeta = {
          nodes: nodes,
          edges: edges,
        };
        console.log('conceptMapMaterial', userKgMeta);
        console.log('concepMapMaterialNode', userKgMeta.nodes);
        this.conceptMapMaterial = userKgMeta;
        this.conceptMapData = userKgMeta;

        //filter edges with no weights, or/and slide's edges
        // the edges aren't filtered completely from the first iteration, so it will keep checking until all have been filtered
        var counter = 1;
        while (counter) {
          var counter = 0;
          this.conceptMapData.edges.forEach((edge, index) => {
            if (edge.data.weight === null) {
              this.conceptMapData.edges.splice(index, 1);
              counter++;
            }
          });
        }
        /*
        //extract node's weight & filter undefined weights
        let weightsArray = [];
        this.conceptMapData.nodes.forEach((node) => {
          if (node.data.weight) {
            weightsArray.push(node.data.weight);
          }
        });

        //get min & max weight
        var maxWeight = Math.max(...weightsArray).toString();
        var minWeight = Math.min(...weightsArray).toString();

        //assign min & max weights to each node to be normalized later
        this.conceptMapData.nodes.forEach((node) => {
          node.data.maxWeight = maxWeight;
          node.data.minWeight = minWeight;
        });*/
        console.log(kgNodes);

        this.selectedFilterValues = ['main_concept'];
        this.filteredMapData = this.conceptMapData;
        this.dataReceivedEvent.emit(this.conceptMapData);
        this.isLoading = false;
        this.loading.emit(false);
        /*if (this.conceptMapData) {
          let matKgControlPanel = document.getElementById(
            'materialKgControlPanel'
          );
          this.renderer.removeClass(matKgControlPanel, 'noContentRecieved');
          matKgControlPanel.style.float = 'right';
        }*/
        var endTime = performance.now();
        console.log(
          `Call to show Engagement_KG took ${endTime - startTime} milliseconds`
        );
      } catch (error) {
        if (error?.status === 404 || error?.status === 403) {
          this.isNotGenerated = true;
        }
        console.error('Error constructing kg', error);
        this.isLoading = false;
        this.loading.emit(false);
      }
    } else if (this.showDNUEngagementKg) {
      console.log('concept map data fetched');
      var startTime = performance.now();
      this.isNotGenerated = false;
      try {
        let kgNodes = [];
        let kgEdges = [];
        const userNode = await this.neo4jService.getDNUEngagement(this.userid);
        const courseNode = await this.neo4jService.getLevelofEngagement(
          this.userid
        ); // to check if user is enrolled in courses
        console.log(userNode);
        if (userNode.records.length !== 0 && courseNode.records.length !== 0) {
          let data = userNode.records;
          var userNodeEle = {
            id: data[0].u.identity.toString(),
            uid: data[0].u.properties.uid,
            type: data[0].u.properties.type,
            name: this.userFullName,
          };
          kgNodes.push(userNodeEle);
          userNode.records.forEach(async (data) => {
            const courseNode = data.target.labels.includes('Course');
            var targetNodeEle = {
              id: data.target.identity.toString(),
              name: courseNode
                ? data.target.properties.name
                  ? data.target.properties.name
                  : data.target.labels[0]
                : data.target.properties.name,
              cid: data.target.properties.cid,
              uri: data.target.properties.uri,
              type: courseNode
                ? data.target.labels[0]
                : data.target.properties.type,
              mid: data.target.properties.mid,
              weight: data.target.properties.weight,
              wikipedia: data.target.properties.wikipedia,
              abstract: data.target.properties.abstract,
              isDeleted: data.target.properties?.isDeleted,
            };
            kgNodes.push(targetNodeEle);
          });
          const mainConceptNodes = kgNodes.filter(
            (node) => node.type === 'main_concept'
          );
          for (let i = mainConceptNodes.length - 1; i >= 1; i--) {
            // make sure user is enrolled in course
            const hasConcept = await this.neo4jService.getHasConcept(
              mainConceptNodes[i].id
            );
            //console.log(hasConcept);
            if (hasConcept.records.length === 0) {
              // Find this node's index in the original kgNodes array
              const indexInKgNodes = kgNodes.findIndex(
                (node) =>
                  node.id === mainConceptNodes[i].id &&
                  node.type === 'main_concept'
              );

              // If found, remove it from kgNodes
              if (indexInKgNodes !== -1) {
                kgNodes.splice(indexInKgNodes, 1);
              }
            }
          }
          for (const data of userNode.records) {
            if (data.target.properties.mid) {
              try {
                await this.neo4jService.addCourseIdtoMaterial(
                  data.target.properties.mid
                );
              } catch (error) {
                console.error('Error adding courseId to material:', error);
              }
            }
          }
          userNode.records.forEach((data) => {
            var edgeEle = {
              type: data.r.type,
              id: data.r.identity.toString(),
              source: data.r.start.toString(),
              target: data.r.end.toString(),
              level: data.r.properties.level,
            };
            kgEdges.push(edgeEle);
          });
          const courseNode = [];
          for (const data of kgNodes) {
            if (data.type === 'Course') {
              try {
                courseNode.push(
                  await this.neo4jService.createCourseConceptRelationship(
                    data.cid
                  )
                );
              } catch (error) {
                console.error('Error adding courseId to material:', error);
              }
            }
          }
          console.log(courseNode);
          courseNode.forEach((result) => {
            if (result.records && result.records.length > 0) {
              result.records.forEach((data) => {
                if (data.r) {
                  var courseEdgeEle = {
                    type: data.r.type,
                    id: data.r.identity.toString(),
                    source: data.r.start.toString(),
                    target: data.r.end.toString(),
                    level:
                      data.r.properties && data.r.properties.level
                        ? data.r.properties.level
                        : undefined,
                  };
                  kgEdges.push(courseEdgeEle);
                }
              });
            }
          });
          const relatedConcepts = [];
          for (const data of kgNodes) {
            if (data.type === 'main_concept') {
              try {
                relatedConcepts.push(
                  await this.neo4jService.getRelatedTo(data.cid)
                );
              } catch (error) {
                console.error('Error getting related concepts:', error);
              }
            }
          }
          console.log(relatedConcepts);
          relatedConcepts.forEach((result) => {
            if (result.records && result.records.length > 0) {
              result.records.forEach((data) => {
                if (data.r) {
                  var relatedEdgeEle = {
                    type: data.r.type,
                    id: data.r.identity.toString(),
                    source: data.r.start.toString(),
                    target: data.r.end.toString(),
                  };
                  kgEdges.push(relatedEdgeEle);
                }
                if (data.target) {
                  var relatedConceptEle = {
                    id: data.target.identity.toString(),
                    name: data.target.properties.name,
                    cid: data.target.properties.cid,
                    uri: data.target.properties.uri,
                    type: data.target.properties.type,
                    mid: data.target.properties.mid,
                    weight: data.target.properties.weight,
                    wikipedia: data.target.properties.wikipedia,
                    abstract: data.target.properties.abstract,
                  };
                  kgNodes.push(relatedConceptEle);
                }
              });
            }
          });
          const categories = [];
          for (const data of kgNodes) {
            if (data.type === 'main_concept') {
              try {
                categories.push(
                  await this.neo4jService.getHasCategory(data.cid)
                );
              } catch (error) {
                console.error('Error getting category concepts:', error);
              }
            }
          }
          console.log(categories);
          categories.forEach((result) => {
            if (result.records && result.records.length > 0) {
              result.records.forEach((data) => {
                if (data.r) {
                  var categoryEdgeEle = {
                    type: data.r.type,
                    id: data.r.identity.toString(),
                    source: data.r.start.toString(),
                    target: data.r.end.toString(),
                  };
                  kgEdges.push(categoryEdgeEle);
                }
                if (data.target) {
                  var categoryConceptEle = {
                    id: data.target.identity.toString(),
                    name: data.target.properties.name,
                    cid: data.target.properties.cid,
                    uri: data.target.properties.uri,
                    type: data.target.properties.type,
                    mid: data.target.properties.mid,
                    weight: data.target.properties.weight,
                    wikipedia: data.target.properties.wikipedia,
                    abstract: data.target.properties.abstract,
                  };
                  kgNodes.push(categoryConceptEle);
                }
              });
            }
          });
        } else {
          const singleUserNode = await this.neo4jService.getSingleUser(
            this.userid
          );
          console.log(singleUserNode);
          let data = singleUserNode.records;
          var userNodeEle = {
            id: data[0].u.identity.toString(),
            uid: data[0].u.properties.uid,
            type: data[0].u.properties.type,
            name: this.userFullName,
          };
          kgNodes.push(userNodeEle);
        }
        const nodes = [];
        const edges = [];
        kgNodes.forEach((data) => {
          let node = { data };
          nodes.push(node);
        });
        kgEdges.forEach((data) => {
          let edge = { data };
          edges.push(edge);
        });
        let userKgMeta = {
          nodes: nodes,
          edges: edges,
        };
        console.log('conceptMapMaterial', userKgMeta);
        console.log('concepMapMaterialNode', userKgMeta.nodes);
        this.conceptMapMaterial = userKgMeta;
        this.conceptMapData = userKgMeta;

        //filter edges with no weights, or/and slide's edges
        // the edges aren't filtered completely from the first iteration, so it will keep checking until all have been filtered
        var counter = 1;
        while (counter) {
          var counter = 0;
          this.conceptMapData.edges.forEach((edge, index) => {
            if (edge.data.weight === null) {
              this.conceptMapData.edges.splice(index, 1);
              counter++;
            }
          });
        }
        /*
        //extract node's weight & filter undefined weights
        let weightsArray = [];
        this.conceptMapData.nodes.forEach((node) => {
          if (node.data.weight) {
            weightsArray.push(node.data.weight);
          }
        });

        //get min & max weight
        var maxWeight = Math.max(...weightsArray).toString();
        var minWeight = Math.min(...weightsArray).toString();

        //assign min & max weights to each node to be normalized later
        this.conceptMapData.nodes.forEach((node) => {
          node.data.maxWeight = maxWeight;
          node.data.minWeight = minWeight;
        });*/
        console.log(kgNodes);

        this.selectedFilterValues = ['main_concept'];
        this.filteredMapData = this.conceptMapData;
        this.dataReceivedEvent.emit(this.conceptMapData);
        this.isLoading = false;
        this.loading.emit(false);
        /*if (this.conceptMapData) {
          let matKgControlPanel = document.getElementById(
            'materialKgControlPanel'
          );
          this.renderer.removeClass(matKgControlPanel, 'noContentRecieved');
          matKgControlPanel.style.float = 'right';
        }*/
        var endTime = performance.now();
        console.log(
          `Call to show DNU_Engagement_KG took ${
            endTime - startTime
          } milliseconds`
        );
      } catch (error) {
        if (error?.status === 404 || error?.status === 403) {
          this.isNotGenerated = true;
        }
        console.error('Error constructing kg', error);
        this.isLoading = false;
        this.loading.emit(false);
      }
    }
  }

  rankNodes(conceptsList: any) {
    //sort nodes to give rank
    conceptsList.nodes.sort((a, b) => b.data.weight - a.data.weight);
    let rank = 1;
    conceptsList.nodes.forEach((node) => {
      node.data.rank = rank;
      rank++;
    });
    this.conceptMapData = conceptsList;
  }

  //prepare formData for [concepts & materials] recommenders
  async getRecommendedMaterialsPerSlide(): Promise<any> {
    const data = {};
    const slideID =
      this.currentMaterial!._id + '_slide_' + this.kgCurrentPage.toString();
    const notUnderstandConceptsIds = [];
    const newConceptsIds = [];

    this.newConceptsObj.forEach((concept) => {
      newConceptsIds.push(concept.cid);
    });

    this.didNotUnderstandConceptsObj.forEach((concept) => {
      notUnderstandConceptsIds.push(concept.cid);
    });
    this.previousConceptsObj.forEach((concept) => {
      let repeated = false;
      this.didNotUnderstandConceptsObj.some((currentConcept) => {
        if (concept.cid.toString() === currentConcept.cid.toString()) {
          repeated = true;
        }
      });
      if (!repeated) {
        notUnderstandConceptsIds.push(concept.cid);
      }
      repeated = false;
    });

    data['courseId'] = this.currentMaterial!.courseId.toString();
    data['materialId'] = this.currentMaterial!._id.toString();
    data['slideId'] = slideID;
    data['materialName'] = this.currentMaterial!.name;
    data['materialURL'] = this.currentMaterial!.url;
    data['materialPage'] = this.kgCurrentPage.toString();
    data['userId'] = this.userid.toString();
    data['userEmail'] = this.userEmail.toString();
    data['username'] = this.username.toString();
    data['understoodConcepts'] = this.allUnderstoodConcepts.toString();
    data['nonUnderstoodConcepts'] = notUnderstandConceptsIds.toString();
    data['newConcepts'] = newConceptsIds.toString();

    return data;
  }
  async getRecommendedMaterialsPerSlideMaterial(): // model: string
  Promise<any> {
    const data = {};
    const slideID =
      this.currentMaterial!._id + '_slide_' + this.kgCurrentPage.toString();
    const notUnderstandConceptsIds = [];
    const newConceptsIds = [];

    this.didNotUnderstandConceptsObj.forEach((concept) => {
      notUnderstandConceptsIds.push(concept.cid);
    });
    this.newConceptsObj.forEach((concept) => {
      newConceptsIds.push(concept.cid);
    });

    this.previousConceptsObj.forEach((concept) => {
      let repeated = false;
      this.didNotUnderstandConceptsObj.some((currentConcept) => {
        if (concept.cid.toString() === currentConcept.cid.toString()) {
          repeated = true;
        }
      });
      if (!repeated) {
        notUnderstandConceptsIds.push(concept.cid);
      }
      repeated = false;
    });

    data['courseId'] = this.currentMaterial!.courseId.toString();
    data['materialId'] = this.currentMaterial!._id.toString();
    data['slideId'] = slideID;
    data['materialName'] = this.currentMaterial!.name;
    data['materialURL'] = this.currentMaterial!.url;
    data['materialPage'] = this.kgCurrentPage.toString();
    data['understoodConcepts'] = this.allUnderstoodConcepts.toString();
    data['nonUnderstoodConcepts'] = notUnderstandConceptsIds.toString();
    data['newConcepts'] = newConceptsIds.toString();

    return data;
  }
  async getMaterialFile() {
    //Change to new approach of getting materials
    var file = fetch(
      `${this.cmEndpointURL}${this.currentMaterial?.url}${this.currentMaterial?._id}.pdf`
    )
      .then((r) => r.blob())
      .then(
        (blobFile) =>
          new File(
            [blobFile],
            this.currentMaterial!.url + this.currentMaterial?._id + '.pdf',
            {
              type: 'application/pdf',
            }
          )
      );
    return file;
  }

  async disabledTabClicked() {
    let counter = 0;

    const startFlashing = () => {
      flashingButton();
    };

    const flashingButton = () => {
      let buttonToRipple = document.getElementById('recommendationButton');
      if (counter < 6) {
        setTimeout(() => {
          if (buttonToRipple.style.backgroundColor === 'white') {
            buttonToRipple.style.backgroundColor = '#eb590d';
          } else {
            buttonToRipple.style.backgroundColor = 'white';
          }
          counter++;
          flashingButton();
        }, 75);
      } else {
        let buttonToRipple = document.getElementById('recommendationButton');
        if (this.disableShowRecommendationsButton) {
          buttonToRipple.style.backgroundColor = '#e0e0e0';
        } else {
          buttonToRipple.style.backgroundColor = '#eb590d';
        }
      }
    };

    startFlashing();
  }

  async handleCancelMiddle() {
    this.updateUserConcepts = true;
    this.onSubmitCancel();
  }

  userConceptsStatus() {
    this.updateUserConcepts = true;
  }
  courseKgShown() {
    this.courseKgActivated = true;
  }
  materialKgShown() {
    this.materialKgActivated = true;
  }

  async onSubmitCancel() {
    //if closed from slide_KG
    if (this.updateUserConcepts) {
      this.updateUserConcepts = false;
      //update user document in mongoDB
      try {
        // make sure to extract newConcepts from understood concepts
        if (this.previousConcepts.understoodConcepts) {
          let newConceptsCid = [];
          this.newConceptsObj.forEach((concept) => {
            newConceptsCid.push(concept.cid.toString());
          });
          this.previousConcepts.understoodConcepts =
            this.previousConcepts.understoodConcepts.filter(
              (x) => !newConceptsCid.includes(x)
            );
        }
        // update understood concepts list
        if (this.understoodConceptsObj) {
          this.understoodConceptsObj.forEach((concept) => {
            this.previousConcepts.understoodConcepts.push(
              concept.cid.toString()
            );
          });
          //update not_understood concepts list
          if (this.didNotUnderstandConceptsObj) {
            this.didNotUnderstandConceptsObj.forEach((concept) => {
              this.previousConcepts.didNotUnderstandConcepts.push(
                concept.cid.toString()
              );
            });
          }
          //remove duplicates
          this.previousConcepts.understoodConcepts = [
            ...new Set(this.previousConcepts.understoodConcepts),
          ];
          this.previousConcepts.didNotUnderstandConcepts = [
            ...new Set(this.previousConcepts.didNotUnderstandConcepts),
          ];

          //clean properties
          this.kgNodes = null;
          this.recommendedConcepts = null;
          this.tabs[1].disabled = true;
          this.tabs[2].disabled = true;
          this.kgTabsActivated = false;
          this.filteredMapData = null;
          this.resultMaterials = null;

          this.concepts1 = null;
          this.concepts2 = null;

          this.recommendedConcepts = null;
          this.conceptMapRecommendedData = null;
          this.filteredMapRecData = null;
          this.recommenderKnowledgeGraph = false;
          this.slideKnowledgeGraph = false;
          this.resultMaterials = null;
          this.kgNodes = [];
          this.mainConceptsTab = true;
          this.recommendedConceptsTab = false;
          this.recommendedMaterialsTab = false;

          this.firstUpdate = false;
          this.allUnderstoodConcepts = null; //clear all understood concepts lidst
          this.hideChevronRightButton = false;
          this.showRecommendationButtonClicked = false;
          this.displaySidebarProperty = false;
          this.conceptMapCourse = [];
          this.conceptMapTopic = [];
          this.conceptMapChannel = [];
          this.conceptMapMaterial = [];
          // end of clean properties

          //send to mongoDB
          this.userConceptsService
            .updateUserConcepts(
              this.userid,
              this.previousConcepts.understoodConcepts,
              this.previousConcepts.didNotUnderstandConcepts
            )
            .subscribe(() => {});
        }
      } catch (err) {
        console.error(err);
      }
    }

    this.courseKgActivated = false;
    this.userKgActivated = false;
    this.materialKgActivated = false;
    this.updateUserConcepts = false;
    this.cmShownEvent.emit(false);
    this.showConceptMap! = false;
    this.showSlideKg = false; //hide slide_KG
    this.showMaterialKg = false;
    this.showCourseKg = false;
    this.kgSlideResponseEmpty = false;
    this.kgSlideReceivedResponse = false;
    this.allConceptsObj = []; //all KG_concaptes
    this.newConceptsObj = []; // kg_concepts with status new
    this.didNotUnderstandConceptsObj = []; // kg_concepts with status notUnderstood
    this.understoodConceptsObj = []; // kg_concepts with status understood
    this.slideConceptservice.setAllConcepts(this.allConceptsObj);
    this.slideConceptservice.setNewConcepts(this.newConceptsObj);
    this.slideConceptservice.setDidNotUnderstandConcepts(
      this.didNotUnderstandConceptsObj
    );
    this.previousConcepts = null;
    this.kgNodes = null;
    this.recommendedConcepts = null;
    this.slideConceptservice.setUnderstoodConcepts(this.understoodConceptsObj);
    this.tabs[1].disabled = true;
    this.tabs[2].disabled = true;
    this.kgTabsActivated = false;
    this.filteredMapData = null;
    this.selectedFilterValues = null;
    this.selectedTopConcepts = null;

    //clean recommenders values
    this.resultMaterials = null;

    this.concepts1 = null;
    this.concepts2 = null;

    this.recommendedConcepts = null;
    this.conceptMapRecommendedData = null;
    this.filteredMapRecData = null;
    this.recommenderKnowledgeGraph = false;
    this.slideKnowledgeGraph = false;
    this.resultMaterials = null;
    this.kgNodes = [];
    this.previousConceptsObj = [];
    this.mainConceptsTab = true;
    this.recommendedConceptsTab = false;
    this.recommendedMaterialsTab = false;
    this.firstUpdate = false;
    this.allUnderstoodConcepts = null; //clear all understood concepts lidst
    this.hideChevronRightButton = false;
    this.showRecommendationButtonClicked = false;
    this.displaySidebarProperty = false;
    this.previousConcepts = [];
    this.conceptMapCourse = [];
    this.conceptMapTopic = [];
    this.conceptMapChannel = [];
    this.conceptMapMaterial = [];
  }
  selectedTopNodes(key) {
    this.selectedTopConcepts = key;
  }

  receiveMaterial(materialId: string) {
    this.materialIdRedirection = materialId;
  }

  receiveCourse(courseId: string) {
    this.courseIdRedirection = courseId;
  }

  async redirectSlide(slideNumber: number) {
    console.log('Navigating to slide:', slideNumber);
    console.log(this.materialIdRedirection);
    console.log(this.courseIdRedirection);
    // this.docURL = `${this.cmEndpointURL}/courses/${this.courseIdRedirection}/materials/${this.materialIdRedirection}/pdf/slide/${slideNumber}/view`;

    await this.materialsService
      .getMaterialById(this.materialIdRedirection)
      .subscribe({
        next: (selectedMaterial) => {
          console.log('Selected Material:', selectedMaterial);
          this.redirectionMaterial = selectedMaterial;
          this.kgCurrentPage = slideNumber;

          this.currentPDFPage = slideNumber;

          // console.log(this.redirectionMaterial.url);
          this.docURL = `/course/${this.redirectionMaterial.courseId}/channel/${this.redirectionMaterial.channelId}/material/(material:${this.redirectionMaterial._id}/pdf)`;
          // this.docURL = this.docURL.split('#')[0] + `#page=${slideNumber}`;
          // window.location.href = this.docURL;
          this.router.navigateByUrl(this.docURL).then(() => {
            // After navigation completes, set the current page
            setTimeout(() => {
              // Dispatch an action to set the current page
              this.store.dispatch(
                AnnotationActions.setCurrentPdfPage({
                  pdfCurrentPage: slideNumber,
                })
              );
            }, 200); // Short delay to ensure the PDF component is loaded
          });
        },
        error: (err) => {
          console.error('Error fetching material:', err);
        },
      });
    // console.log(selectedMaterial);
    // Update the current page in the concept map
    // console.log(this.currentMaterial?.url, this.currentMaterial?._id);
  }

  redirectCourse(courseLanding: string) {
    console.log(courseLanding);
    this.docURL = `/course/${courseLanding}/welcome`;
    this.router.navigateByUrl(this.docURL);
  }

  noUserNodeMessage() {
    this.messageService.add({
      key: 'noUserNode',
      severity: 'info',
      summary: 'User is not enrolled in any course',
      detail:
        'No Personal Knowledge Graph could be generated because user has not enrolled in any courses yet',
      life: 5000,
    });
  }
}
