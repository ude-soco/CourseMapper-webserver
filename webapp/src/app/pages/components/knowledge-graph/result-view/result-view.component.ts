import { getCurrentPdfPage } from './../../annotations/pdf-annotation/state/annotation.reducer';
import { Component, Input } from '@angular/core';
import { VideoElementModel } from '../videos/models/video-element.model';
import { ArticleElementModel } from '../articles/models/article-element.model';
import { MenuItem } from 'primeng/api';
import { ResourcesPagination, UserResourceFilterResult, UserResourceFilterParamsResult, Concept } from 'src/app/models/croForm';
import { CustomRecommendationOptionService } from 'src/app/services/custom-recommenation-option.service';
import { MaterialsRecommenderService } from 'src/app/services/materials-recommender.service';
import { Subscription } from 'rxjs';
import { SlideConceptsService } from 'src/app/services/slide-concepts.service';
import { Material } from 'src/app/models/Material';
import { Store } from '@ngrx/store';
import { State } from 'src/app/state/app.reducer';

interface MaterialModel {
  name: string;
  code: string;
}
enum MaterialModels {
  MODEL_1 = '1',
  MODEL_2 = '2',
  MODEL_3 = '3',
  MODEL_4 = '4',
}
interface PageEvent {
  first: number;
  rows: number;
  page: number;
  pageCount: number;
}


@Component({
  selector: 'app-result-view',
  templateUrl: './result-view.component.html',
  styleUrls: ['./result-view.component.css'],
})
export class ResultViewComponent {
  currentPdfPage: number;

  private conceptFromChipObj: any = null;
  private didNotUnderstandConceptsObj: any[];
  private understoodConceptsObj: any[];
  videos: VideoElementModel[] = [];
  articles: ArticleElementModel[] = [];
  chipMenuU: MenuItem[];
  chipMenuDNU: MenuItem[];
  chipMenuNew: MenuItem[];
  materialModels: MaterialModel[];
  allConceptsObj: any[];
  selectedMaterialModel: string;
  results: any[] = [];
  concepts: any[] = [];
  recievedVideoResultIsEmpty = true;
  recievedArticleResultIsEmpty = true;

  @Input() resourcesPagination: ResourcesPagination = null;
  @Input() userId: string;
  activeIndex: number = 0; 
  firstPaginator = 0;
  rowsPaginator = 10;

  firstVideo: number = 0;
  rowsVideo: number = 10;
  firstArticle: number = 0;
  rowsArticle: number = 10;
  options = [
    { label: 10, value: 10 },
    { label: 30, value: 30 },
    { label: 50, value: 50 },
    { label: 100, value: 100 }
  ];

  disabledSortingKeys = false;
  orderUpIcon = false;
  orderDESC = "Top to bottom"
  orderASC = "Bottom to top"
  selectedFactorSortingKeys: any = null;
  factorSortingKeys = [
    { name: 'Most similar',key: "similarity_score", status: false, orderText: this.orderDESC },
    { name: 'Most recent', key: "creation_date", status: false, orderText: this.orderDESC },
    { name: 'Most viewed', key: "views", status: false, orderText: this.orderDESC },
    { name: 'Most liked', key: "like_count", status: false, orderText: this.orderDESC },
    { name: 'Most rated', key: "user_rating", status: false, orderText: this.orderDESC },
    { name: 'Most saved', key: "saves_count", status: false, orderText: this.orderDESC }
  ];
  factorsTabArticle = ["similarity_score", "saves_count", "user_rating"];
  filteringParamsSavedTab = {
    user_id: '',
    cids: [],
    content_type: 'video',
    text: ''
  }
  showSearchIconPinner = false;
  filteringResourcesFound: UserResourceFilterResult;

  mainConceptSelected: any | undefined;
  midSelected: any | undefined;
  sliderNberSelected: any | undefined;
  resourcesSaved: UserResourceFilterParamsResult;
  filteringParamsSavedTab2 = {
    user_id: null,
    cids: [],
    mids: [],
    slider_numbers: []
  }
  isLoadingResource = true;
  ridsUserSaves = [];
  conceptsModifiedByUser: Concept[] = [];
  conceptModifiedByUserSelected: any | undefined;

  paginatorPage: number = 0;
  paginatorRows: number = 10;
  rowsPerPageOptions = [10, 30, 50];
  dnuColor = [
    '#F06292', // pink[300]
    '#BA68C8', // purple[300]
    '#7986CB', // indigo[300]
    '#64B5F6', // blue[300]
    '#4DD0E1', // cyan[300]
    '#4DB6AC', // teal[300]
    '#81C784', // green[300]
    '#DCE775', // lime[300]
    '#FFD54F', // amber[300]
    '#A1887F', // brown[300]
  ];

  @Input() currentMaterial?: Material;
  subscriptions: Subscription = new Subscription(); // Manage subscriptions

  constructor(
    private slideConceptservice: SlideConceptsService,
    private materialsRecommenderService: MaterialsRecommenderService,
    private croService: CustomRecommendationOptionService,
    private store: Store<State>
  ) {

    slideConceptservice.didNotUnderstandConcepts.subscribe((res) => {
      this.didNotUnderstandConceptsObj = res;
      this.didNotUnderstandConceptsObj.forEach((el) => {
        this.allConceptsObj = this.allConceptsObj?.map((e) =>
          e.cid === el?.cid ? el : e
        );
      });
    });

    slideConceptservice.understoodConcepts.subscribe((res) => {
      this.understoodConceptsObj = res;
      this.understoodConceptsObj.forEach((el) => {
        this.allConceptsObj = this.allConceptsObj?.map((e) =>
          e.cid === el.cid ? el : e
        );
      });
    });

    // Subscribe to get the current PDF page from store
    this.subscriptions.add(
      this.store.select(getCurrentPdfPage).subscribe((page) => {
        this.currentPdfPage = page;
      })
    );
  }

  handleOnShowOnHide() {
    console.log('OverlayPanel is up and down');
    this.orderUpIcon = this.orderUpIcon === false ? true : false;
  }
  
  ngOnInit(): void {
    console.log('MaterialModels.MODEL_1', MaterialModels.MODEL_1);
    this.setLeftPanelMWinWidth();
   

    this.materialModels = [
      { name: 'Model 1', code: MaterialModels.MODEL_1 },
      { name: 'Model 2', code: MaterialModels.MODEL_2 },
      { name: 'Model 3', code: MaterialModels.MODEL_3 },
      { name: 'Model 4', code: MaterialModels.MODEL_4 },
    ];

    this.chipMenuU = [
      {
        label: 'Mark as understood',
        icon: 'pi pi-check',
        command: (e) => {
          this.slideConceptservice.updateUnderstoodConcepts(
            this.conceptFromChipObj
          );
          this.conceptFromChipObj = null;
        },
      },
    ];

    this.chipMenuNew = [
      {
        label: 'Mark as understood',
        icon: 'pi pi-check',
        command: (e) => {
          this.slideConceptservice.updateUnderstoodConcepts(
            this.conceptFromChipObj
          );
        },
      },
      {
        label: 'Mark as not understood',
        icon: 'pi pi-check',
        command: (e) => {
          this.slideConceptservice.updateDidNotUnderstandConcepts(
            this.conceptFromChipObj
          );
        },
      },
    ];

    this.chipMenuDNU = [
      {
        label: 'Mark as not understood',
        icon: 'pi pi-check',
        command: (e) => {
          this.slideConceptservice.updateDidNotUnderstandConcepts(
            this.conceptFromChipObj
          );
        },
      },
    ];

    this.loadResultForSelectedModel();

    this.didNotUnderstandConceptsObj =
      this.slideConceptservice.commonDidNotUnderstandConcepts;
    this.didNotUnderstandConceptsObj.forEach((el) => {
      this.allConceptsObj = this.allConceptsObj.map((e) =>
        e.id === el.id ? el : e
      );
    });

    this.understoodConceptsObj =
      this.slideConceptservice.commonUnderstoodConcepts;
    this.understoodConceptsObj.forEach((el) => {
      this.allConceptsObj = this.allConceptsObj.map((e) =>
        e.id === el.id ? el : e
      );
    });
  }

  ngAfterViewInit() {
       console.log('all concepts object:', this.allConceptsObj);
    console.log('concepts:', this.concepts);
  }

  ngOnChanges() {
    this.loadResultForSelectedModel();
  }

  setChipConcept(concept): void {
    this.conceptFromChipObj = {
      // id: concept.id,
      cid: concept.cid, // deal with cid instead of id 'AMR'
      name: concept.name,
      status: concept.status === 'understood' ? 'notUnderstood' : 'understood',
      type: concept.type, // This is undefined because there were no type coming from the backend
    };

    // console.log(
    //   'Recommendation based on: mark as understood... concept',
    //   concept
    // );
  }

  loadResultForSelectedModel() {
    this.allConceptsObj = this.resourcesPagination?.concepts;
    this.allConceptsObj.forEach(concept => {
      concept["status"] = "notUnderstood"
    });
    this.concepts = this.allConceptsObj;

    if (this.resourcesPagination?.nodes?.videos.total_items > 0) {
      this.recievedVideoResultIsEmpty = false;
      this.logUserViewedRecommendedVideos();
    } else {
      this.recievedVideoResultIsEmpty = true;
    }
    if (this.resourcesPagination?.nodes?.articles.total_items > 0) {
      this.recievedArticleResultIsEmpty = false;
    } else {
      this.recievedArticleResultIsEmpty = true;
    }
  }

  tabChanged(tab) {
    this.activeIndex = tab;
    this.setLeftPanelMWinWidth();
    this.deactivateDnuInteraction();

    // Pause videos (if any) when changing tabs
    document.querySelectorAll('iframe').forEach((iframe) => {
      const result = iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
    });

    if (tab === 0) {
      this.logUserViewedRecommendedVideos();
    } else if (tab === 1) {
      this.logUserViewedRecommendedArticles();
    }

    if (this.activeIndex === 2) {
      this.getRidsFromUserSaves();
      this.getConceptsModifiedByUserFromSaves();
    }
    this.closeVideoFrame();
    this.deactivateSortingKeys();

    this.croService.setResultaTabValue(this.activeIndex.toString());
    if (this.activeIndex === 0 || this.activeIndex === 1) {
      this.selectedFactorSortingKeys = null;
    }
  }

  deactivateSortingKeys() {
    if (this.activeIndex === 1 ) {
      this.disabledSortingKeys = true;
    } else {
      this.disabledSortingKeys = false;
    }
  }

  setLeftPanelMWinWidth() {
    let ipo_interact = document.getElementById('ipo_interact');
    ipo_interact.style.minWidth = "30rem";
    ipo_interact.style.width = "30rem";
  }

  deactivateDnuInteraction() {
    if (this.activeIndex === 2) {
      this.filteringParamsSavedTab.user_id = this.userId;
      this.getUserResources(this.filteringParamsSavedTab);
    }
  }

  filteringResourcesSaved() {
    this.showSearchIconPinner = this.filteringParamsSavedTab.text.length >= 3 ? true : false;
    if (this.filteringParamsSavedTab.text.length > 3) {
      this.getUserResources(this.filteringParamsSavedTab);
    } else {
      this.filteringResourcesFound = { articles: [], videos: [] };
    }
  }

  onContentTypeChange(event: any) {
    if (event.value) {
      this.getUserResources(this.filteringParamsSavedTab);
    }
  }

  onInitGetUserResources() {
    this.filteringParamsSavedTab.user_id = this.userId;
    this.conceptModifiedByUserSelected = [... this.conceptsModifiedByUser]
    let cids = this.conceptModifiedByUserSelected.map(concept => concept.cid);
    this.filteringParamsSavedTab.cids = cids;
    this.getUserResources(this.filteringParamsSavedTab);
  }

  getUserResources(params) {
    this.filteringResourcesFound = { articles: [], videos: [] };
    this.materialsRecommenderService.filterUserResourcesSavedBy(params)
      .subscribe({
        next: (data: UserResourceFilterResult) => {
          this.filteringResourcesFound = data;
          this.showSearchIconPinner = false;
        },
        error: (err) => {
          console.log(err);
        },
      }
    );
  }

  getRidsFromUserSaves() {
    this.materialsRecommenderService.getRidsFromUserSaves(this.userId)
      .subscribe({
        next: (data: []) => {
          this.ridsUserSaves = data;
          this.resourcesPagination?.nodes?.videos.content.forEach((video: VideoElementModel) => video.is_bookmarked_fill = this.ridsUserSaves.includes(video.rid) );
          this.resourcesPagination?.nodes?.articles.content.forEach((article: ArticleElementModel) => article.is_bookmarked_fill = this.ridsUserSaves.includes(article.rid) );
        },
        error: (err) => {
          console.log(err);
        },
      }
    );
  }

  getConceptsModifiedByUserFromSaves() {
    this.materialsRecommenderService.getConceptsModifiedByUserFromSaves(this.userId)
      .subscribe({
        next: (data: Concept[]) => {
          this.conceptsModifiedByUser = data;
          this.onInitGetUserResources();
        },
        error: (err) => {
          console.log(err);
        },
      }
    );
  }

  onChangeConceptsModifiedByUser(event) {
    let cids = event.value.map(concept => concept.cid);
    this.filteringParamsSavedTab.cids = cids;
    this.getUserResources(this.filteringParamsSavedTab);
  }

  closeVideoFrame() {
    let button = document.getElementById('backToList');
    if (button) {
        button.click();
    }
  }

  sortResourcesByKeys(factor, statusRadio: boolean, statusFac: boolean) {
    if (statusRadio === true) {
      // factor.orderText = factor.orderText === this.orderDESC ? this.orderASC : this.orderDESC;
      this.sortResourcesBy(factor);
    } else if (statusRadio === false && statusFac === true) {

      factor.orderText = factor.orderText === this.orderDESC ? this.orderASC : this.orderDESC;
      this.sortResourcesBy(factor);
    }
  }

  sortResourcesBy(factor) {
    let key = "";
    if (factor.key === "similarity_score") {
      key = "similarity_score";
    } else if (factor.key === "creation_date") {
      key = "publish_time";
    } else if (factor.key === "views") {
      key = "views";
    } else if (factor.key === "user_rating") {
      key = "helpful_count";
    } else if (factor.key === "like_count") {
      key = "like_count";
    } else if (factor.key === "saves_count") {
      key = "saves_count";
    }

    if (factor.orderText === this.orderASC) {
      if (this.activeIndex === 0) {
        if (key === "publish_time") {
          this.resourcesPagination.nodes.videos.content.sort((a, b) => new Date(a[key]).getTime() - new Date(b[key]).getTime());
        } else {
          this.resourcesPagination.nodes.videos.content.sort((a, b) => a[key] - b[key]);
        }
      } else if (this.activeIndex === 1) {
        this.resourcesPagination.nodes.articles.content.sort((a, b) => a[key] - b[key]);
      }
    } else if (factor.orderText === this.orderDESC) {
      if (this.activeIndex === 0) {
        if (key === "publish_time") {
          this.resourcesPagination.nodes.videos.content.sort((a, b) => new Date(b[key]).getTime() - new Date(a[key]).getTime());
        } else {
          this.resourcesPagination.nodes.videos.content.sort((a, b) => b[key] - a[key]);
        }
      } else if (this.activeIndex === 1) {
        this.resourcesPagination.nodes.articles.content.sort((a, b) => b[key] - a[key]);
      }
    }
  }

  onPageChangeResourcesPaginator(event: PageEvent, type) {
    this.firstPaginator = event.first;
    this.rowsPaginator = event.rows;

    const page_number = this.firstPaginator + 1;
    const page_size = this.rowsPaginator;

    let reqDataFinal = JSON.parse(localStorage.getItem('resourcesPaginationParams'));
    reqDataFinal.rec_params.pagination_params = {page_number: page_number, page_size: page_size};
    localStorage.setItem('resourcesPaginationParams', JSON.stringify(reqDataFinal));

    this.resourcesPagination = null;
    this.materialsRecommenderService
    .getRecommendedMaterials(reqDataFinal)
    .subscribe({
      next: (result) => {
          this.resourcesPagination = result;
        },
        complete: () => {
        },
      }
    );
  }

  onPageChangeResourcesPaginatorV2(event) {
    const page_number = event.page + 1;
    const page_size = event.rows;

    let reqDataFinal = JSON.parse(localStorage.getItem('resourcesPaginationParams'));
    reqDataFinal.rec_params.pagination_params = {page_number: page_number, page_size: page_size};
    localStorage.setItem('resourcesPaginationParams', JSON.stringify(reqDataFinal));

    this.resourcesPagination = null;
    this.materialsRecommenderService
    .getRecommendedMaterials(reqDataFinal)
    .subscribe({
      next: (result) => {
          this.resourcesPagination = result;
        },
        complete: () => {
        },
      }
    );
  }

  
  async logUserViewedRecommendedVideos() {
    try {
      const data = {
        materialId: this.currentMaterial._id,
        videos: this.videos,
        materialPage: this.currentPdfPage,
      };
      if (!this.recievedVideoResultIsEmpty) {
        await this.materialsRecommenderService.logViewRecommendedVideos(data);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }
  async logUserViewedRecommendedArticles() {
    try {
      const data = {
        materialId: this.currentMaterial!._id,
        articles: this.articles,
        materialPage: this.currentPdfPage,
      };
      if (!this.recievedArticleResultIsEmpty) {
        await this.materialsRecommenderService.logViewRecommendedArticles(data);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  /*
  generateConceptColor(): String {
    hexValues = [pink[300], purple[300], indigo[300], blue[300], cyan[300], teal[300], green[300], lime[300], amber[300], brown[300]];

  }
  */

/*   generateRandomRGB(indexcolor: number): string {
    const hexValues = [
      '#F06292', // pink[300]
      '#BA68C8', // purple[300]
      '#7986CB', // indigo[300]
      '#64B5F6', // blue[300]
      '#4DD0E1', // cyan[300]
      '#4DB6AC', // teal[300]
      '#81C784', // green[300]
      '#DCE775', // lime[300]
      '#FFD54F', // amber[300]
      '#A1887F', // brown[300]
    ];
    console.log(indexcolor)
    return hexValues[indexcolor] || '#A1887F'; // Default color if index is out of range

  
} */
}
