import { DOCUMENT } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnChanges,
  ChangeDetectorRef,
  OnDestroy,
  Renderer2,
  Inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { MenuItem, MessageService } from 'primeng/api';
import { Subscription, lastValueFrom } from 'rxjs';
import { Channel } from 'src/app/models/Channel';
import { Course } from 'src/app/models/Course';
import { Material } from 'src/app/models/Material';
import { Topic } from 'src/app/models/Topic';
import { User } from 'src/app/models/User';
import { CallRecommendationsService } from 'src/app/services/call-recommendations.service';
import { ConceptMapService } from 'src/app/services/concept-map-service.service';
import { KgTabsActivationService } from 'src/app/services/kg-tabs-activation.service';
import { MaterialKgOrderedService } from 'src/app/services/material-kg-ordered.service';
import { MaterialsRecommenderService } from 'src/app/services/materials-recommender.service';
import { Neo4jService } from 'src/app/services/neo4j.service';
import { PdfviewService } from 'src/app/services/pdfview.service';
import { SlideConceptsService } from 'src/app/services/slide-concepts.service';
import { SlideKgOrderedService } from 'src/app/services/slide-kg-ordered.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { UserConceptsService } from 'src/app/services/user-concepts.service';
import { UserServiceService } from 'src/app/services/user-service.service';
import { State, getLoggedInUser } from 'src/app/state/app.reducer';
import { environment } from 'src/environments/environment';
import { getCurrentMaterial } from '../../materials/state/materials.reducer';
import { getCurrentPdfPage } from '../../annotations/pdf-annotation/state/annotation.reducer';
import { ViewChild } from '@angular/core';
interface conceptModel {
  name: string;
  code: string;
}
interface topN {
  name: string;
  code: string;
}

@Component({
  selector: 'app-concept-map',
  templateUrl: './concept-map.component.html',
  styleUrls: ['./concept-map.component.css'],
})
export class ConceptMapComponent {
  // @Input() material?: Material;
  @Input() course?: Course;
  @Input() showConceptMap?: boolean;
  @Input() isCmLoading?: boolean;
  @Output() cmShownEvent: EventEmitter<boolean> = new EventEmitter();
  @Output() dataReceivedEvent: EventEmitter<any> = new EventEmitter();
  @Output() loading: EventEmitter<boolean> = new EventEmitter();
  @Output() topConceptsEvent: EventEmitter<any> = new EventEmitter();

  models = [
    { label: 'Transformers', value: 'squeezebert/squeezebert-mnli' },
    //{ label: "ElMo", value: '' },
  ];
  topConcepts = [
    { label: '15', value: 15 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: '150', value: 150 },
    { label: '200', value: 200 },
    { label: 'All', value: 'All' },
  ];

  // allChecked = false;

  // checkOptionsOne = [
  //   {
  //     label: 'Main Concepts',
  //     value: 'annotation',
  //     checked: true,
  //     disabled: true,
  //   },
  //   { label: 'Related Concepts', value: 'property', checked: true },
  //   { label: 'Categories', value: 'category', checked: true },
  // ];

  selectedFilterValues?: string[];
  defaultModel = 'squeezebert/squeezebert-mnli';
  // defaultTopConcepts = 100;
  defaultTopConcepts = 15;
  selectedTopConcepts?: any;
  selectedModel?: string;
  isLoading?: boolean;
  isNotGenerated?: boolean;
  showConcepts?: boolean; // to show concepts if retrieved
  username: any; //to assign current userName
  userid: any; //to assign current userID
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
  kgTabsActivated = false;
  recommendedConcepts = null;
  // recommendedConceptsModel2 = null;
  // recommendedConceptsModel3 = null;
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
  conceptModels: conceptModel[];
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
  courseIsEmpty?: boolean = undefined;

  tabs = [
    {
      label: 'Main Concepts',
      command: (e) => {
        let tempMapData = this.filteredMapData;
        this.filteredMapData = null;
        this.mainConceptsTab = true;
        this.recommendedConceptsTab = false;
        console.log(this.filteredMapData);
        setTimeout(() => {
          this.filteredMapData = tempMapData;
          console.log(this.filteredMapData);
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
    { name: 'Main Concepts', key: 'main_concept' },
    { name: 'Related Concepts', key: 'related_concept' },
    { name: 'Categories', key: 'category' },
  ];

  public conceptMapData: any;
  public filteredMapData: any;
  public filterUpdated: boolean = false;
  public conceptMapRecommendedData: any;
  public filteredMapRecData: any;
  public filterRecUpdated: boolean = false;
  public slideKnowledgeGraph: boolean = false;
  public recommenderKnowledgeGraph: boolean = false;

  currentSubscription: Subscription; //to get currentPage num
  totalSubscription: Subscription; //to get totalPage num
  slideKgSubscription: Subscription; // on slideKg ordered
  materialKgSubscription: Subscription; // on materialKg ordered
  courseKgSubscription: Subscription; // on courseKg ordered
  allConceptslist: Subscription; // list of all concepts
  tabsSubscription: Subscription; // on slideKg ordered
  allConceptsSubscription: Subscription; // on allconcepts list updated
  newConceptsSubscription: Subscription; // on new concepts list updated
  didNotUnderstandConceptsSubscription: Subscription; // on did not understand concepts list updated
  understoodConceptsSubscription: Subscription; // on understood concepts list updated
  nodeClickedSubscription: Subscription; // check if a node has been clicked
  slideKgDatabase: Subscription; // database of slide KG
  graphRenderedSubscription: Subscription; // graph done rendering
  statusSubscription: Subscription; // concept's status changed
  materialInfoSubscription: Subscription; // concept's status changed
  selectedMaterialModelSubscription: Subscription;
  newConceptSubsciption: Subscription;
  understoodConceptSubsciption: Subscription;
  notUnderstoodConceptSubsciption: Subscription;
  callRecommendationsSubsciption: Subscription;
  userSubscription: Subscription;
  materialSubscription: Subscription;
  constructor(
    private messageService: MessageService, //show toast messages
    private conceptMapService: ConceptMapService, //Build material KG
    private materialsRecommenderService: MaterialsRecommenderService, // Get slide's recommendations for KG
    private userService: UserServiceService, //get currentUser info
    private pdfViewService: PdfviewService,
    private materialKgGenerator: MaterialKgOrderedService, //Get informed when user asked for Material KG
    private slideKgGenerator: SlideKgOrderedService, //Get informed when user asked for Slide KG
    private kgTabs: KgTabsActivationService, //Enable KG tabs once recommendations arrived
    private slideConceptservice: SlideConceptsService, //Change concepts' status on slide_KG [new, understood, did not understand]
    // private materialInfo: MaterialInfoService,
    private neo4jService: Neo4jService, // communicate to neo4j server
    private userConceptsService: UserConceptsService, //get current user concepts: all previousely marked as [understood, did not understand]
    private callRecommendationsService: CallRecommendationsService,
    private topicChannelService: TopicChannelService, // gets channels' detail
    private renderer: Renderer2,
    private changeDetectorRef: ChangeDetectorRef, // avoids errors when property changed after being checked
    @Inject(DOCUMENT) private doc: Document,
    private store: Store<State>
  ) {
    // get current user
    this.userSubscription = this.store
      .select(getLoggedInUser)
      .subscribe((user) => (this.loggedInUser = user));

    this.slideKgSubscription = this.slideKgGenerator
      .generateSlideKG()
      .subscribe(() => {
        console.log('did not understand clicked');
        this.filteredMapData = null;
        // get selected material
        this.materialSubscription = this.store
          .select(getCurrentMaterial)
          .subscribe((material) => {
            this.currentMaterial = material;
            if (this.currentMaterial) {
              // get current page number to extend kg on slide level
              this.currentSubscription = this.store
                .select(getCurrentPdfPage)
                .subscribe((page) => {
                  this.kgCurrentPage = page;
                  console.log('current page is: ' + this.kgCurrentPage);
                });
            }
            // console.log('material subscribe')
            // console.log(this.currentMaterial)
          });
        // this.filteredMapData = null;
        this.showSlideKg = true;
        this.showMaterialKg = false;
        this.showCourseKg = false;

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
        setTimeout(() => {
          this.getConceptMapDataCurrentSlide();
        }, 10);
      }); //call slideKG & show slideKG
    this.materialKgSubscription = this.materialKgGenerator
      .generateMaterialKG()
      .subscribe(() => {
        this.conceptMapData = null;
        this.filteredMapData = null;
        // this.materialKgActivated =true
        setTimeout(() => {
          //reset dropdown value
          this.selectedTopN = null;
          this.selectedTopNodes(15);
          //reset checkboxes values
          this.selectedOption = this.selectedCheckOptions.slice(0, 1);
          //get current material's data
          this.currentMaterial = materialKgGenerator.selectedMaterialService;
          //activate material kg & ensure that other views are deactivated
          this.showMaterialKg = true;
          this.showCourseKg = false;
          this.showSlideKg = false;
          setTimeout(() => {
            this.getConceptMapData();
          }, 10);
        }, 0);
      }); //Show materialKG

    this.courseKgSubscription = this.materialKgGenerator
      .generateCourseKG()
      .subscribe(() => {
        this.conceptMapData = null;
        this.filteredMapData = null;
        this.showMaterialKg = false;
        this.showCourseKg = true;
        this.showSlideKg = false;
        setTimeout(() => {
          this.kgTitle = materialKgGenerator.selectedCourseService.name;
          //reset dropdown value
          this.selectedTopN = null;
          this.selectedTopNodes(15);
          setTimeout(() => {
            this.getConceptMapData();
          }, 10);
        }, 0);
      }); //Show courseKG

    this.tabsSubscription = this.kgTabs.activateKgTabs().subscribe(() => {
      this.tabs[1].disabled = false;
      this.tabs[2].disabled = false;
      this.kgTabsActivated = true;
    }); //Activate tabs
    this.newConceptsSubscription = slideConceptservice.newConcepts.subscribe(
      (res) => {
        let found = false;
        this.newConceptsObj = res;
        if (!this.firstUpdate) {
          if (this.previousConcepts) {
            res.forEach((nObj) => {
              this.previousConceptsObj.some((previousObj, index) => {
                if (previousObj.cid.toString() == nObj.cid.toString()) {
                  this.previousConceptsObj.splice(index, 1);
                }
                if (this.previousConcepts.understoodConcepts) {
                  this.previousConcepts.understoodConcepts.some(
                    (oldConceptCid, understoodIndexOld) => {
                      if (oldConceptCid.toString() === nObj.cid.toString()) {
                        this.previousConcepts.understoodConcepts.splice(
                          understoodIndexOld,
                          1
                        );
                        found = true;
                      }
                    }
                  );
                }
                if (!found && this.previousConcepts.didNotUnderstandConcepts) {
                  this.previousConcepts.didNotUnderstandConcepts.some(
                    (oldConceptCid, notUnderstoodIndexOld) => {
                      if (oldConceptCid.toString() === nObj.cid.toString()) {
                        this.previousConcepts.didNotUnderstandConcepts.splice(
                          notUnderstoodIndexOld,
                          1
                        );
                      }
                    }
                  );
                }
                found = false;
              });
            });
          } else {
            res.forEach((nObj) => {
              this.previousConceptsObj.some((previousObj, index) => {
                if (previousObj.cid.toString() == nObj.cid.toString()) {
                  this.previousConceptsObj.splice(index, 1);
                }
              });
            });
          }
        }
      }
    );
    this.didNotUnderstandConceptsSubscription =
      slideConceptservice.didNotUnderstandConcepts.subscribe((res) => {
        let found = false;
        this.didNotUnderstandConceptsNames = [];
        this.didNotUnderstandConceptsObj = res;
        this.didNotUnderstandConceptsObj.forEach((concept) => {
          this.didNotUnderstandConceptsNames.push(concept.name); //for Paul (Material Recommender)
        });
        if (!this.firstUpdate) {
          if (this.previousConcepts) {
            res.forEach((dObj) => {
              if (this.previousConcepts.understoodConcepts) {
                this.previousConcepts.understoodConcepts.some(
                  (oldConceptCid, understoodIndexOld) => {
                    if (oldConceptCid.toString() === dObj.cid.toString()) {
                      this.previousConcepts.understoodConcepts.splice(
                        understoodIndexOld,
                        1
                      );
                      found = true;
                    }
                  }
                );
              }
              if (!found && this.previousConcepts.didNotUnderstandConcepts) {
                this.previousConcepts.didNotUnderstandConcepts.some(
                  (oldConceptCid, notUnderstoodIndexOld) => {
                    if (oldConceptCid.toString() === dObj.cid.toString()) {
                      this.previousConcepts.didNotUnderstandConcepts.splice(
                        notUnderstoodIndexOld,
                        1
                      );
                    }
                  }
                );
              }
              found = false;
            });
          }
        }

        const notUnderstandConceptsIds = [];

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
        this.totalNotUnderstoodList = notUnderstandConceptsIds;
        this.totalNotUnderstood = notUnderstandConceptsIds.length;
        if (notUnderstandConceptsIds.length) {
          this.disableShowRecommendationsButton = false;
        } else {
          this.disableShowRecommendationsButton = true;
        }

        if (this.totalNotUnderstood > 9) {
          this.badgeMessage = '+9 - Not understood concepts';
        } else {
          this.badgeMessage =
            this.totalNotUnderstood.toString() + ' - Not understood concepts';
        }
        if (document.getElementById('dnuConceptsBadge')) {
          document.getElementById('dnuConceptsBadge');
          let badge = document.getElementById('dnuConceptsBadge');
          let badgeNode =
            document.getElementById('dnuConceptsBadge').childNodes[0];
          if (badge) {
            this.badgeChanged = true;
            this.renderer.addClass(badge, 'conceptsListChanged');
            setTimeout(() => {
              this.renderer.removeClass(badge, 'conceptsListChanged');
              this.badgeChanged = false;
            }, 3000);
          }
        }
      });
    this.understoodConceptsSubscription =
      slideConceptservice.understoodConcepts.subscribe((res) => {
        let found = false;
        this.understoodConceptsObj = res;
        if (!this.firstUpdate) {
          if (this.previousConcepts) {
            res.forEach((uObj) => {
              this.previousConceptsObj.some((previousObj, index) => {
                if (previousObj.cid.toString() == uObj.cid.toString()) {
                  this.previousConceptsObj.splice(index, 1);
                }
                if (this.previousConcepts.understoodConcepts) {
                  this.previousConcepts.understoodConcepts.some(
                    (oldConceptCid, understoodIndexOld) => {
                      if (oldConceptCid.toString() === uObj.cid.toString()) {
                        this.previousConcepts.understoodConcepts.splice(
                          understoodIndexOld,
                          1
                        );
                        found = true;
                      }
                    }
                  );
                }
                if (!found && this.previousConcepts.didNotUnderstandConcepts) {
                  this.previousConcepts.didNotUnderstandConcepts.some(
                    (oldConceptCid, notUnderstoodIndexOld) => {
                      if (oldConceptCid.toString() === uObj.cid.toString()) {
                        this.previousConcepts.didNotUnderstandConcepts.splice(
                          notUnderstoodIndexOld,
                          1
                        );
                      }
                    }
                  );
                }
                found = false;
              });
            });
          } else {
            res.forEach((nObj) => {
              this.previousConceptsObj.some((previousObj, index) => {
                if (previousObj.cid.toString() == nObj.cid.toString()) {
                  this.previousConceptsObj.splice(index, 1);
                }
              });
            });
          }
        }
      });
    // this.callRecommendationsSubsciption = callRecommendationsService
    //   .recommendationsObserved()
    //   .subscribe(() => {
    //     if (this.allUnderstoodConcepts) {
    //       // this.getRecommendationsAttributes();
    //       this.showRecommendations();
    //     }
    //   });

    this.conceptModels = [
      { name: 'Model 1', code: '1' },
      { name: 'Model 2', code: '2' },
      { name: 'Model 3', code: '3' },
    ];

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
  selectedConceptsCheckbox: string[];
  chipMenu: MenuItem[];
  chipMenuPrevious: MenuItem[];
  selectedCategories: any[] = ['Current slide', 'Previous slide'];
  conceptscategories: any[] = [
    { name: 'Current slide', key: 'C' },
    { name: 'All slides', key: 'P' },
  ];

  selectedRecModel: any = null;

  recModels: any[] = [
    { name: 'Model 1', key: '1' },
    { name: 'Model 2', key: '2' },
    { name: 'Model 3', key: '3' },
  ];
  // *ngIf="recommendedConcepts"
  checkedCategories: boolean = false;
  model1 = true;
  model2 = false;
  model3 = false;

  ngOnDestroy(): void {
    this.conceptMapData = undefined;
    this.loading.emit(this.isLoading);

    this.currentSubscription?.unsubscribe();
    this.totalSubscription?.unsubscribe();
    this.slideKgSubscription?.unsubscribe();
    this.materialKgSubscription?.unsubscribe();
    this.courseKgSubscription?.unsubscribe();
    this.allConceptslist?.unsubscribe();
    this.tabsSubscription?.unsubscribe();
    this.allConceptsSubscription?.unsubscribe();
    this.newConceptsSubscription?.unsubscribe();
    this.didNotUnderstandConceptsSubscription?.unsubscribe();
    this.understoodConceptsSubscription?.unsubscribe();
    this.nodeClickedSubscription?.unsubscribe();
    this.slideKgDatabase?.unsubscribe();
    this.graphRenderedSubscription?.unsubscribe();
    this.statusSubscription?.unsubscribe();
    this.materialInfoSubscription?.unsubscribe();
    this.selectedMaterialModelSubscription?.unsubscribe();
    this.newConceptSubsciption?.unsubscribe();
    this.understoodConceptSubsciption?.unsubscribe();
    this.notUnderstoodConceptSubsciption?.unsubscribe();
    this.callRecommendationsSubsciption?.unsubscribe();
    this.userSubscription?.unsubscribe();
    this.materialSubscription?.unsubscribe();
  }
  ngOnChanges() {
    if (this.course) {
      this.selectedCourse = this.course;
    }
    // this.currentMaterial = this.material;
    // if (this.material) {
    //   this.currentMaterial = this.material;
    // }
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
    this.resetFilter();

    // if (this.showSlideKg) {
    //   this.getConceptMapDataCurrentSlide();
    // }
  }
  ngOnInit() {
    console.log(this.currentMaterial);
    if (this.loggedInUser) {
      console.log(this.loggedInUser);
      this.userid = this.loggedInUser.id;
      this.username = this.loggedInUser.username;
      this.userEmail = this.loggedInUser.email;
    }
    this.chipMenu = [
      {
        label: 'Mark as understood',
        icon: 'pi pi-check',
        command: (e) => {
          //if marked previously as Not_understood, update the list
          this.previousConceptsObj =
              this.previousConceptsObj.filter(
                (concept) => concept.cid !== this.conceptFromChipObj.cid)
          this.previousConcepts.didNotUnderstandConcepts =
              this.previousConcepts.didNotUnderstandConcepts.filter(
                (concept) => concept !== this.conceptFromChipObj.cid)
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
          console.log(this.previousConceptsObj, this.previousConcepts.understoodConcepts)
          this.previousConceptsObj =
              this.previousConceptsObj.filter(
                (concept) => concept.cid !== this.conceptFromChipObj.cid)
          this.previousConcepts.didNotUnderstandConcepts =
              this.previousConcepts.didNotUnderstandConcepts.filter(
                (concept) => concept !== this.conceptFromChipObj.cid)
          console.log(this.previousConceptsObj, this.previousConcepts.understoodConcepts)
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
                (concept) => concept !== this.previousConceptFromChipObj.cid)
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
                (concept) => concept !== this.previousConceptFromChipObj.cid)
          this.slideConceptservice.updateNewConcepts(this.previousConceptFromChipObj);
          this.previousConceptFromChipObj = null;
        },
      },
    ];
    this.selectedCategories = this.conceptscategories.slice(0, 1);

    this.selectedRecModel = this.recModels[0];
    this.selectedOption = this.selectedCheckOptions.slice(0, 1);
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

      let dnuPanel = document.getElementById('flexboxNotUnderstood')
      if (dnuPanel) {
        let sideBarComponent = dnuPanel.childNodes[0].childNodes[0].childNodes[1] as HTMLElement
        const previousConcepts = document.getElementById('previousConcepts')
        const currentConcepts = document.getElementById('currentConcepts')
        if (sideBarComponent.clientHeight >= this.cyHeight - 100) {
          if (previousConcepts) {
            document.getElementById('previousConcepts').style.height = Number(this.cyHeight * 0.8).toString() + 'px'
            document.getElementById('previousConcepts').style.overflowY = 'scroll'
            if (sideBarComponent.clientHeight >= this.cyHeight - 100) {
              document.getElementById('previousConcepts').style.height = Number(this.cyHeight * 0.18).toString() + 'px'
            } else {
              document.getElementById('previousConcepts').style.height = Number(this.cyHeight * 0.8).toString() + 'px'
            }
          }
          if (currentConcepts) {
            if (sideBarComponent.clientHeight >= this.cyHeight - 100) {
              document.getElementById('currentConcepts').style.maxHeight = Number(this.cyHeight * 0.35).toString() + 'px'
              document.getElementById('currentConcepts').style.overflowY = 'scroll'
            } else {
              document.getElementById('currentConcepts').style.overflowY = 'auto'
            }
          }
        } else {
          if (previousConcepts) {
            document.getElementById('previousConcepts').style.maxHeight = Number(this.cyHeight * 0.8).toString() + 'px'
            document.getElementById('previousConcepts').style.overflowY = 'scroll'
          }
        }
      }
    }

    if (!this.showSlideKg && this.updateUserConcepts) {
      this.onSubmitCancel();
    }

    // if(!this.showMaterialKg && this.materialKgActivated){
    //     this.onSubmitCancel();
    // }

    if (this.materialKgActivated && !this.showMaterialKg) {
      console.log('cancelled');
      this.materialKgActivated = false;

      // this.dropdownMaterial.reset();
      // this.onSubmitCancel();
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
        console.log(e);
      }
    }
    if (this.showMaterialKg) {
      this.cyHeight = window.innerHeight * 0.9 - 270;
      this.stopCheck = true;
      this.changeDetectorRef.detectChanges();
    }
    this.cyWidth = window.innerWidth * 0.9;
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
    if (this.showMaterialKg) {
      var startTime = performance.now();
      this.isNotGenerated = false;
      try {
        const materialId = this.currentMaterial!._id;
        // Check availability in neo4j
        const materialFound = await this.neo4jService.checkMaterial(materialId);
        // get slide_kg from neo4j
        if (materialFound.records.length) {
          let kgNodes = [];
          let kgEdges = [];
          const materialNodes = await this.neo4jService.getMaterial(materialId);
          const materialEdges = await this.neo4jService.getMaterialEdges(
            materialId
          );
          materialNodes.records.forEach((data) => {
            var type = data.type;
            var conceptName = this.capitalizeWords(data.name);
            var nodeEle;
            var rank = data.rank;
            nodeEle = {
              id: data.id,
              cid: data.cid,
              name: conceptName,
              uri: data.uri,
              type: type,
              weight: data.weight,
              wikipedia: data.wikipedia,
              abstract: data.abstract,
            };
            // }
            kgNodes.push(nodeEle);
          });
          materialEdges.records.forEach((data) => {
            let edgeEle = {
              type: data.type,
              source: data.source,
              target: data.target,
              weight: data.weight,
            };
            kgEdges.push(edgeEle);
          });
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
          let materialKgMeta = {
            nodes: nodes,
            edges: edges,
          };
          this.conceptMapMaterial = materialKgMeta;
          this.conceptMapData = materialKgMeta;
        } else {
          try {
            console.log('no kg saved, constructing a new one...');
            this.resetFilter();
            this.isLoading = true;
            this.loading.emit(true);
            const reqData = await this.getReqData();
            var result = await this.conceptMapService.getConceptMapData(
              reqData
            );
            if (materialId !== this.currentMaterial!._id) {
              return;
            }
            console.log('result from python server' + result);
            this.conceptMapData = result;
            // capitalize nodes names
            this.conceptMapData.nodes.forEach((node) => {
              node.name = this.capitalizeWords(node.name);
            });
          } catch (error) {
            if (error.status === 404) {
              this.isNotGenerated = true;
            }
            console.log('Error:', error);
            this.isLoading = false;
            this.loading.emit(false);
          }
        }

        //filter edges with no weights, or/and slide's edges
        // the edges aren't filtered completely from the first iteration, so it will keep checking until all have been filtered
        var counter = 1;
        while (counter) {
          var counter = 0;
          console.log('conceptMapData edges' , this.conceptMapData);
          this.conceptMapData.edges.forEach((edge, index) => {
            if (edge.data.weight === null) {
              this.conceptMapData.edges.splice(index, 1);
              counter++;
            }
          });
        }
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
        });

        this.selectedFilterValues = ['main_concept'];
        this.filteredMapData = this.conceptMapData;
        this.dataReceivedEvent.emit(this.conceptMapData);
        this.isLoading = false;
        this.loading.emit(false);
        if (this.conceptMapData) {
          let matKgControlPanel = document.getElementById(
            'materialKgControlPanel'
          );
          this.renderer.removeClass(matKgControlPanel, 'noContentRecieved');
          matKgControlPanel.style.float = 'right';
        }
        console.log(
          'ConceptMapComponent:::getConceptMapData',
          this.conceptMapData
        );
        var endTime = performance.now();
        console.log(
          `Call to show Material_KG took ${endTime - startTime} milliseconds`
        );
      } catch (error) {
        console.log('Error:', error);
        this.isLoading = false;
        this.loading.emit(false);
      }
    } else if (this.showCourseKg) {
      this.courseIsEmpty = undefined;
      //get top-50 concepts for all coures's materials
      try {
        var avgWeight: Number;
        avgWeight = Number(maxWeight) - 0.05;
        let materialsIds = new Array();
        var channels: any;
        channels = this.selectedCourse.channels;
        await channels.forEach((channelId) => {
          this.topicChannelService
            .getChannel(this.selectedCourse._id, channelId)
            .subscribe((channelFromBackend) => {
              channelFromBackend.materials.forEach((material) => {
                if (material.type === 'pdf') {
                  materialsIds.push(material._id.toString());
                }
              });
            });
        });
        setTimeout(async () => {
          this.courseIsEmpty = materialsIds.length === 0;
          if (this.courseIsEmpty) {
            return;
          }

          //wait 100 ms before executing next commands to assure recieving materialIDs form previous subscription
          const courseMaterialsNodes =
            await this.neo4jService.getHigherLevelsNodes(materialsIds);

          // queryEdges = queryEdges + ') RETURN TYPE(r) as type, ID(a) as source, ID(b) as target, r.weight as weight'

          // // const courseMaterialsEdges = await this.neo4jService.getHigherLevelsEdges(
          // //   materialsIds
          // // );
          const courseMaterialsEdges =
            await this.neo4jService.getHigherLevelsEdges(materialsIds);
          console.log(courseMaterialsEdges);
          let kgNodes = [];
          let kgEdges = [];
          courseMaterialsNodes.records.forEach((data) => {
            var type = data.type;
            var nodeEle;
            var conceptName = data.name;
            nodeEle = {
              id: data.id,
              cid: data.cid,
              name: this.capitalizeWords(conceptName),
              uri: data.uri,
              type: type,
              weight: data.weight,
              wikipedia: data.wikipedia,
              abstract: data.abstract,
              rank: data.rank,
              mid: data.mid,
            };
            kgNodes.push(nodeEle);
          });

          let uniqueNodes = [];
          let uniqueNodesNames = [];
          kgNodes.forEach((node) => {
            if (uniqueNodesNames.includes(node.name)) {
            } else {
              uniqueNodesNames.push(node.name.toString());
              uniqueNodes.push(node);
            }
          });
          kgNodes = uniqueNodes;
          if (courseMaterialsEdges.records) {
            courseMaterialsEdges.records.forEach((data) => {
              let edgeEle = {
                type: data.type,
                source: data.source,
                target: data.target,
                weight: data.weight,
              };
              kgEdges.push(edgeEle);
            });
          }

          let nodesIds = [];
          kgNodes.forEach((node) => {
            nodesIds.push(node.id);
          });
          //filter edges with no weights, or/and slide's edges
          // the edges aren't filtered completely from the first iteration, so it will keep checking until all have been filtered
          var counter = 1;
          while (counter) {
            var counter = 0;
            kgEdges.forEach((edge, index) => {
              if (edge.weight === null) {
                kgEdges.splice(index, 1);
                counter++;
              } else if (
                !nodesIds.includes(edge.source) ||
                !nodesIds.includes(edge.target)
              ) {
                kgEdges.splice(index, 1);
                counter++;
              }
            });
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
          let courseKgMeta = {
            nodes: nodes,
            edges: edges,
          };
          //filter edges with no weights, or/and slide's edges
          // the edges aren't filtered completely from the first iteration, so it will keep checking until all have been filtered
          var counter = 1;
          while (counter) {
            var counter = 0;
            courseKgMeta.edges.forEach((edge, index) => {
              if (edge.data.weight === null) {
                courseKgMeta.edges.splice(index, 1);
                counter++;
              }
            });
          }
          //extract node's weight & filter undefined weights
          let weightsArray = [];
          courseKgMeta.nodes.forEach((node) => {
            if (node.data.weight) {
              weightsArray.push(node.data.weight);
            }
          });
          //get min & max weight
          var maxWeight = Math.max(...weightsArray).toString();
          var minWeight = Math.min(...weightsArray).toString();

          //assign min & max weights to each node to be normalized later
          courseKgMeta.nodes.forEach((node) => {
            node.data.maxWeight = maxWeight;
            node.data.minWeight = minWeight;
          });

          this.conceptMapData = courseKgMeta;

          this.filteredMapData = this.conceptMapData;
          if (this.conceptMapData) {
            let matKgControlPanel = document.getElementById(
              'materialKgControlPanel'
            );
            this.renderer.removeClass(matKgControlPanel, 'noContentRecieved');
            matKgControlPanel.style.float = 'right';
          }
        }, 100);
      } catch { }
    }
  }
  async getReqData() {
    const data = {};

    data['modelName'] = this.selectedModel!;
    data['courseId'] = this.currentMaterial!.courseId;
    data['materialId'] = this.currentMaterial!._id;

    return data;
  }
  async getConceptMapDataCurrentSlide() {
    //make sure that all used properties have been cleaned
    this.allConceptsObj = []; //all KG_concaptes
    this.newConceptsObj = []; // kg_concepts with status new
    this.didNotUnderstandConceptsObj = []; // kg_concepts with status notUnderstood
    this.understoodConceptsObj = []; // kg_concepts with status understood
    this.slideConceptservice.setAllConcepts(this.allConceptsObj);
    this.slideConceptservice.setNewConcepts(this.newConceptsObj);
    this.slideConceptservice.setDidNotUnderstandConcepts(
      this.didNotUnderstandConceptsObj
    );
    this.previousConceptsObj = [];
    this.previousConcepts = null;
    this.kgNodes = [];

    //end cleaning properties

    var startTime = performance.now();
    this.userConceptsService
      .getUserConcepts(this.userid)
      .subscribe({
        next: async (val) => {
          this.previousConcepts = val;
          if (this.previousConcepts.understoodConcepts) {
            this.allUnderstoodConcepts = this.previousConcepts.understoodConcepts;
          }
          //get material's concepts_ids
          const materialId = this.currentMaterial!._id;
          // Check material_KG availability in neo4j
          const materialFound = await this.neo4jService.checkMaterial(materialId);
          //if material_KG found
          if (materialFound.records.length) {
            // get slide_kg from neo4j
            const materialNodes = await this.neo4jService.getMaterialConceptsIds(
              materialId
            );
            //Prepare kgNodes to contain [cid & name] for all concepts of "CurrentMaterial"
            materialNodes.records.forEach((data) => {
              let nodeObj = {
                cid: data.id.toString(),
                name: data.name,
              };
              this.kgNodes.push(nodeObj);
            });
            //from this material's concepts [kgNodes],
            // get only (id & name) for the concepts that the user previously did not understand
            // save to this.previousConceptsObj
            if (this.previousConcepts.didNotUnderstandConcepts) {
              this.previousConcepts.didNotUnderstandConcepts.forEach((cid) => {
                let conceptObj: any;
                // var repeated = false;
                conceptObj = this.kgNodes.find(
                  (concept) => concept.cid.toString() === cid.toString()
                );
                if (conceptObj) {
                  this.previousConceptsObj.push(conceptObj);
                }
              });
            }
          }
          const slideId =
            this.currentMaterial!._id +
            '_slide_' +
            this.kgCurrentPage.toString();
          // Check slide_KG availability in neo4j
          const slideFound = await this.neo4jService.checkSlide(slideId);
          // get slide_kg from neo4j
          if (slideFound.records.length) {
            // list of current slide_KG nodes
            let slideKgNodes = [];
            const slideNodes = await this.neo4jService.getSlide(slideId);
            slideNodes.records.forEach((data) => {
              let conceptName = this.capitalizeWords(data.name);
              let nodeEle = {
                id: data.id,
                cid: data.cid,
                name: conceptName,
                uri: data.uri,
                type: data.type,
                weight: data.weight,
                wikipedia: data.wikipedia,
                abstract: data.abstract,
              };
              slideKgNodes.push(nodeEle);
            });
            const nodes = [];
            //turn it to a pattern that is readable to cytoscape
            slideKgNodes.forEach((data) => {
              let node = { data };
              nodes.push(node);
            });
            let slideKgMeta = {
              nodes: nodes,
            };
            this.conceptMapData = slideKgMeta;
          } else {
            this.conceptMapData = { nodes: [] };
            console.log('no kg saved...');
          }
          //Start assigning status for current user [understood, not understood, new concept]

          //if result contains nodes
          if (this.conceptMapData.nodes.length) {
            var understood = false;
            var notUnderstood = false;
            // for current slide, check if any concept.cid === cid of previously understood concept
            this.conceptMapData.nodes.forEach((node) => {
              //if there are previous nodes marked by user as understood
              if (this.previousConcepts.understoodConcepts) {
                //check if user understood concepts exists in current slide
                this.previousConcepts.understoodConcepts.some((cid) => {
                  if (node.data.cid.toString() === cid) {
                    //assign a status
                    node.data.status = 'understood';
                    understood = true;
                  }
                });
              }
              //Check for user not understood concepts
              if (!understood && this.previousConcepts.didNotUnderstandConcepts) {
                this.previousConcepts.didNotUnderstandConcepts.some((cid) => {
                  if (node.data.cid.toString() === cid) {
                    node.data.status = 'notUnderstood';
                    notUnderstood = true;
                  }
                });
              }
              //if not marked
              if (!understood && !notUnderstood) {
                node.data.status = 'unread';
              }
              understood = false;
              notUnderstood = false;
            });

            //Assign nodes' status to related list [all_nodes, understood_nodes, not_understood_nodes, new_concepts_nodes] in a service
            this.conceptMapData.nodes.forEach((node) => {
              let nodeId = node.data.id.toString();
              let nodeCid = node.data.cid.toString();
              let nodeName = node.data.name;
              let nodeObj = {
                id: nodeId,
                name: nodeName,
                status: node.data.status,
                cid: nodeCid,
              };
              this.allConceptsObj.push(nodeObj);
              if (node.data.status === 'notUnderstood') {
                this.didNotUnderstandConceptsObj.push(nodeObj);
              } else if (node.data.status === 'understood') {
                this.understoodConceptsObj.push(nodeObj);
              } else {
                this.newConceptsObj.push(nodeObj);
              }
            });
            this.firstUpdate = true;
            this.slideConceptservice.setAllConcepts(this.allConceptsObj);
            this.slideConceptservice.setNewConcepts(this.newConceptsObj);
            this.slideConceptservice.setDidNotUnderstandConcepts(
              this.didNotUnderstandConceptsObj
            );
            this.slideConceptservice.setUnderstoodConcepts(
              this.understoodConceptsObj
            );
            this.firstUpdate = false;
            this.rankNodes(this.conceptMapData);

            // emit kg to cytoscape
            this.dataReceivedEvent.emit(this.conceptMapData);
            this.filteredMapData = this.conceptMapData;
            this.kgSlideResponseEmpty = false;
            console.log(
              'ConceptMapComponent:::getConceptMapData',
              this.conceptMapData
            );
          } else {
            this.kgSlideResponseEmpty = true;
            console.log('No KG received for this slide!!');
          }
          this.kgSlideReceivedResponse = true;
          var endTime = performance.now();
          console.log(
            `Call to show Slide_KG took ${endTime - startTime} milliseconds`
          );
          this.slideConceptservice.setAllNotUnderstoodConcepts(
            this.totalNotUnderstoodList
          );
          setTimeout(() => {
            this.showConceptsList();
          }, 1);

          var slideKgDialogDiv = document.getElementById('slideKgDialogDiv');
          setTimeout(() => {
            var flexboxNotUnderstood = document.getElementById(
              'flexboxNotUnderstood'
            );
            this.slideKgWidth =
              slideKgDialogDiv.offsetWidth - flexboxNotUnderstood.offsetWidth;
            document.getElementById('graphSection').style.width =
              this.slideKgWidth + 'px';
          }, 5);
        },
        error: (err) => {
          console.log(err);
        }
      })
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
  async showRecommendations() {
    if (this.disableShowRecommendationsButton) {
      this.infoToast();
    } else {
      //prepare a list of all understood concepts
      try {
        this.recommendedConcepts = null;
        this.conceptMapRecommendedData = this.recommendedConcepts;
        this.filteredMapRecData = this.conceptMapRecommendedData;
        this.tabs[1].disabled = true;
        this.tabs[2].disabled = true;
        this.kgTabsActivated = false;

        this.understoodConceptsObj.forEach((concept) => {
          this.allUnderstoodConcepts.push(concept.cid);
        });
        //remove duplicates
        this.allUnderstoodConcepts = [...new Set(this.allUnderstoodConcepts)];
        //substract not_understood concepts [if converted from understood]
        let notUConcepts = [];
        this.didNotUnderstandConceptsObj.forEach((concept) => {
          notUConcepts.push(concept.cid);
        });
        this.allUnderstoodConcepts = this.allUnderstoodConcepts.filter(
          (x) => !notUConcepts.includes(x)
        );
        //substract new concepts [if converted from understood]
        let newConcepts = [];
        this.newConceptsObj.forEach((concept) => {
          newConcepts.push(concept.cid);
        });
        this.allUnderstoodConcepts = this.allUnderstoodConcepts.filter(
          (x) => !newConcepts.includes(x)
        );
      } catch (err) {
        console.log(err);
      }
      this.showRecommendationButtonClicked = true;
      // this.callRecommendationsService.showRecommendationsClicked();

      // prepare form of understood & did not understand concepts
      const reqData = await this.getRecommendedMaterialsPerSlide();
      ////////////////////////////////Call Concept recommender///////////////////////////////////////
      // // //Send request for concept recommendation

      const reqDataMaterial1 =
        await this.getRecommendedMaterialsPerSlideMaterial();

      this.materialsRecommenderService.getRecommendedConcepts(
        // reqData
        reqDataMaterial1
      ).subscribe({
        next: async (resultConcepts) => {
          this.recommendedConcepts = resultConcepts;

          this.conceptMapRecommendedData = this.recommendedConcepts;
          this.filteredMapRecData = this.conceptMapRecommendedData;
          this.recommenderKnowledgeGraph = true;
          this.slideKnowledgeGraph = true;
          if (this.showConceptsListSidebar) {
            setTimeout(() => {
              this.showConceptsList();
            }, 1);
          } else {
            setTimeout(() => {
              this.hideConceptsList();
            }, 1);
          }

          console.log('recommended concepts are:');
          console.log(this.filteredMapRecData);
          this.kgTabs.kgTabsEnable();
          this.mainConceptsTab = false;
          this.recommendedConceptsTab = true;
          // this.tabs[2].disabled = true;
          this.recommendedMaterialsTab = false;
          //////////////////////////call material-recommender/////////////////////////
          console.log('calling material recommender');
          this.materialsRecommenderService.getRecommendedMaterials(
            reqData
          ).subscribe({
            next: (result) => {
              console.log('material recommender has been called');
              console.log('#################################################');
              // // // get from local storage
              // this.resultMaterials = JSON.parse(
              //   localStorage.getItem('resultMaterials')
              // );
              this.resultMaterials = result;

              console.log(this.resultMaterials);
              this.concepts1 = this.resultMaterials.concepts;
              this.concepts1.forEach((el, index, array) => {
                if (
                  this.didNotUnderstandConceptsObj.some(
                    (concept) => concept.id.toString() === el.id.toString()
                  )
                ) {
                  el.status = 'notUnderstood';
                  array[index] = el;
                } else if (
                  this.previousConceptsObj.some(
                    (concept) => concept.cid.toString() === el.cid.toString()
                  )
                ) {
                  el.status = 'notUnderstood';
                  array[index] = el;
                } else if (
                  this.understoodConceptsObj.some(
                    (concept) => concept.id.toString() === el.id.toString()
                  )
                ) {
                  el.status = 'understood';
                  array[index] = el;
                } else {
                  el.status = 'unread';
                  array[index] = el;
                }
              });

              // //set to local storage
              // localStorage.setItem(
              //   'resultMaterials',
              //   JSON.stringify(this.resultMaterials)
              // );
              // this.resultMaterials = this.resultMaterials.nodes;
              /////////////////////////////////////////////////////////////////////////
              // // // get from local storage
              // this.resultMaterials = JSON.parse(
              //   localStorage.getItem('resultMaterials')
              // ).nodes;

              this.resultMaterials = this.resultMaterials.nodes;

              console.log('tab 2 will be activated');
              this.kgTabs.kgTabsEnable();
              console.log('tab 2 has been activated');

              console.log(
                'getconceptMapRecommendedData:::getconceptMapRecommendedData',
                this.conceptMapRecommendedData
              );
            },
            complete: () => {
              this.showRecommendationButtonClicked = false;
            }
          }) // receive recommended materials

        },
        error: (error) => {
          console.log('Error:', error);
          this.displayMessage(error.message);
          this.isLoading = false;
          this.loading.emit(false);
        }
      })
      //receive recommended concepts

      // // //set to local storage
      // localStorage.setItem(
      //   'resultConcepts',
      //   JSON.stringify(this.recommendedConcepts)
      // );
      ////////////////////////////////////////////////////////////////////

      // // // get from local storage
      // this.recommendedConcepts = JSON.parse(
      //   localStorage.getItem('resultConcepts')
      // );
      // // activate after recommenders evaluations
      // this.kgTabs.kgTabsEnable();
      // this.mainConceptsTab = false;
      // this.recommendedConceptsTab = true;
      // this.recommendedMaterialsTab = false;
    }
  }
  //prepare formData for [concepts & materials] recommenders
  async getRecommendedMaterialsPerSlide(): Promise<any> {
    const data = {};
    const slideID =
      this.currentMaterial!._id + '_slide_' + this.kgCurrentPage.toString();
    const notUnderstandConceptsIds = [];
    // const understoodConceptsIds = [];
    const newConceptsIds = [];

    console.log('newConceptsObj', this.newConceptsObj);
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

    // this.understoodConceptsObj.forEach((concept) => {
    //   understoodConceptsIds.push(concept.cid);
    // });

    // formData.append('model', this.selectedModel!);
    // formData.append("materialId", this.currentMaterial!._id);
    data['courseId'] = this.currentMaterial!.courseId.toString();
    data['materialId'] = this.currentMaterial!._id.toString();
    data['slideId'] = slideID;
    data['materialName'] = this.currentMaterial!.name;
    data['materialURL'] = this.currentMaterial!.url;
    data['materialPage'] = this.kgCurrentPage.toString();
    data['userId'] = this.userid.toString();
    data['userEmail'] = this.userEmail.toString();
    data['username'] = this.username.toString();
    data['understoodConcepts'] =
      this.allUnderstoodConcepts.toString();
    data['nonUnderstoodConcepts'] =
      notUnderstandConceptsIds.toString();
    data['newConcepts'] = newConceptsIds.toString();

    return data;
  }
  async getRecommendedMaterialsPerSlideMaterial(): // model: string
    Promise<any> {
    const data = {}
    const slideID =
      this.currentMaterial!._id + '_slide_' + this.kgCurrentPage.toString();
    const notUnderstandConceptsIds = [];
    const newConceptsIds = [];

    // const understoodConceptsIds = [];

    this.didNotUnderstandConceptsObj.forEach((concept) => {
      notUnderstandConceptsIds.push(concept.cid);
    });
    console.log('newConceptsObj', this.newConceptsObj);
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

    // this.understoodConceptsObj.forEach((concept) => {
    //   understoodConceptsIds.push(concept.cid);
    // });

    // formData.append('model', this.selectedModel!);
    data['courseId'] = this.currentMaterial!.courseId.toString();
    data['materialId'] = this.currentMaterial!._id.toString();
    data['slideId'] = slideID;
    data['materialName'] = this.currentMaterial!.name;
    data['materialURL'] = this.currentMaterial!.url;
    data['materialPage'] = this.kgCurrentPage.toString();
    data['understoodConcepts'] =
      this.allUnderstoodConcepts.toString();
    data['nonUnderstoodConcepts'] =
      notUnderstandConceptsIds.toString();
    data['newConcepts'] = newConceptsIds.toString();

    return data;
  }
  async getMaterialFile() {
    //Change to new approach of getting materials
    var file = fetch(
      `${this.cmEndpointURL}${this.currentMaterial?.url}${this.currentMaterial?._id}.pdf`
    )
      // var file = fetch(`${this.cmEndpointURL}${this.currentMaterial?.url}`)
      .then((r) => r.blob())
      .then(
        (blobFile) =>
          // new File([blobFile], this.currentMaterial!.url, {
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
          console.log('inside flashing');
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
    console.log('cancel');
    //if closed from slide_KG
    if (this.updateUserConcepts) {
      console.log('hello from if statement');
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

          console.log('hello before mongoDB');
          console.log(this.previousConcepts.understoodConcepts)
          console.log(this.previousConcepts.didNotUnderstandConcepts)
          //send to mongoDB
          this.userConceptsService.updateUserConcepts(
            this.userid,
            this.previousConcepts.understoodConcepts,
            this.previousConcepts.didNotUnderstandConcepts
          ).subscribe(() => { });
        }
      } catch (err) {
        console.log(err);
      }
    }
    console.log('hello from out of if statement');

    this.courseKgActivated = false;
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
    this.model1 = true;
    this.model2 = false;
    this.model3 = false;
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
  updateSingleChecked(key): void {
    if (this.selectedFilterValues.find((item) => item === key)) {
      this.selectedFilterValues = this.selectedFilterValues.filter(
        (item) => item !== key
      );
    } else {
      this.selectedFilterValues.push(key);
    }
  }
  resetFilter() {
    // this.checkOptionsOne.forEach((item) => {
    //   item.checked = true;
    // });
    // this.filterUpdated = false;
    // this.selectedFilterValues = this.checkOptionsOne
    //   .filter((item) => item.checked)
    //   .map((i) => i.value);
  }

  kgTabsAreaClicked() {
    // ripple show-recommendations button onClick on tabs if not activated
    let kgTabsArea = document.getElementById('kgTabsArea');
    if (kgTabsArea) {
      let showRecommendationsButton = document.getElementById(
        'recommendationButton'
      );
      if (showRecommendationsButton) {
        let x = showRecommendationsButton.clientWidth;
        let y = showRecommendationsButton.clientHeight;
        let ripple = document.createElement('span');
        ripple.style.position = 'absolute';
        ripple.style.width = x + 'px';
        ripple.style.height = y + 'px';
        ripple.style.backgroundColor = '#ffffff'; //danger color
        ripple.style.borderRadius = '12px';
        ripple.style.pointerEvents = 'none';
        ripple.style.animation = 'animate 5s linear infinite';
        showRecommendationsButton.appendChild(ripple);
        setTimeout(() => {
          ripple.remove();
        }, 300);
      }
    }
  }

  capitalizeWords(str) {
    var words = str.split(' ');
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      var firstLetter = word.charAt(0);
      words[i] = firstLetter.toUpperCase() + word.slice(1);
    }
    return words.join(' ');
  }
  infoToast() {
    this.messageService.add({
      key: 'emptyList',
      severity: 'warn',
      summary: 'Empty Not Understood Concepts List',
      detail: 'Select not understood concept(s) from the graph!',
    });
  }
  displayMessage(message: string): void {
    this.messageService.add({
      key: 'server_response',
      severity: 'error',
      summary: 'INTERNAL SERVER ERROR',
      detail: "Please click on 'Show Recommendations' again",
    });
  }
}
