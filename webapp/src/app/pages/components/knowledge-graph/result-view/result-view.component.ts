import { Component, Input, ViewChild } from '@angular/core';
import { VideoElementModel } from '../videos/models/video-element.model';
import { ArticleElementModel } from '../articles/models/article-element.model';
import { MenuItem } from 'primeng/api';
// import { MaterialsRecommenderService } from 'src/app/services/materials-recommender.service';
import { Subscription } from 'rxjs';
import { SlideConceptsService } from 'src/app/services/slide-concepts.service';
import { ResourcesPagination, ResourceNode, UserResourceFilterParamsResult } from 'src/app/models/croForm';
import { CustomRecommendationOptionComponent } from '../custom-recommendation-option/custom-recommendation-option.component';
import { MaterialsRecommenderService } from 'src/app/services/materials-recommender.service';

interface MaterialModel {
  name: string;
  code: string;
}
enum MaterialModels {
  MODEL_1 = '1',
  MODEL_2 = '2',
  MODEL_3 = '3',
  MODEL_4 = '4'
}


// interface croVideoElementModel {
//   current_page?: number;
//   total_pages?: number;
//   total_items?: number;
//   content?: VideoElementModel[];
// }

// interface croArticleElementModel {
//   current_page?: number;
//   total_pages?: number;
//   total_items?: number;
//   content?: ArticleElementModel[];
// }


@Component({
  selector: 'app-result-view',
  templateUrl: './result-view.component.html',
  styleUrls: ['./result-view.component.css']
})
export class ResultViewComponent {
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

  @Input()
  public concepts1: any[] = [];
  @Input()
  public concepts2: any[] = [];

  // @Input()
  // public results: any[] = [];
  @Input() public results1: any[] = [];
  @Input() public results2: any[] = [];
  @Input() public results3: any[] = [];
  @Input() public results4: any[] = [];

  // boby024
  @Input() croForm: any;
  // @Input() didNotUnderstandConceptsObjFromCROfOrm: any[];
  // @Input() previousConceptsObj: any[];
  @ViewChild('croComponent', { static: false }) croComponent: CustomRecommendationOptionComponent;
  @Input() resourcesPagination: ResourcesPagination;
  @Input() userId: string;
  activeIndex: number = 0; 

  croSorting = {
    similarity_score: { status: false, arrow: false},
    publish_time: { status: false, arrow: false},
    views: { status: false, arrow: false}
  }

  /*mainConceptsSource = [ { cid: "sdsd1", name: "Data Mining", status: false }, { cid: "sdsd2", name: "Internet Retrieval", status: false } ];
  learningMaterialsSource = [ { mid: "s323f", name: "Learning Analytics", status: false } ];
  sliderNumbersSource = [ { name: "slide_1", status: false } ];
  resourcesSved = [
    { mid: "m1", mid_name: "Learning Analytics", slider_number: "slide_1", cid: "c1", concept_name: "Data Mining", status: false },
    { mid: "m1", mid_name: "Learning Analytics", slider_number: "slide_1", cid: "c2", concept_name: "Internet Retrieval", status: false },
    { mid: "m1", mid_name: "Learning Analytics", slider_number: "slide_1", cid: "c3", concept_name: "Information Mining", status: false },
    { mid: "m1", mid_name: "Learning Analytics", slider_number: "slide_3", cid: "c4", concept_name: "Recall & Precision", status: false },
    { mid: "m2", mid_name: "Cloud & Mobile", slider_number: "slide_1", cid: "c5", concept_name: "Https", status: false },
  ];

  mainConceptsFiltered = [];
  mainConceptSelected: any | undefined;
  learningMaterialsFiltered = [];
  sliderNumbersFiltered = [];
  */

  filteringParamsSavedTab = {
    keyTextFiltering: '',
    contentType: ''
  }

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

  /*
  croVideos: VideoElementModel[]; // croVideoElementModel;
  croArticles: ArticleElementModel[]; // croArticleElementModel;
  // croPaginatorFirst: number = 0;
  // croPaginatorRows: number = 10;
  // totalRecordsDefault = 1;
  // scrollPanelHeight = '550px';


  croOnPageChange(event) {
    this.croPaginatorFirst = event.first;
    this.croPaginatorRows = event.rows;

    // call backend api for paginate/sorting result
    this.paginateResult()
    // 
  }
  */
  
  constructor(
    private slideConceptservice: SlideConceptsService,
    private materialsRecommenderService: MaterialsRecommenderService,
  ) {
    slideConceptservice.didNotUnderstandConcepts.subscribe((res) => {
      this.didNotUnderstandConceptsObj = res;
      this.didNotUnderstandConceptsObj.forEach((el) => {
        this.allConceptsObj = this.allConceptsObj.map((e) =>
          e.id === el.id ? el : e
        );
      });
    });

    slideConceptservice.understoodConcepts.subscribe((res) => {
      this.understoodConceptsObj = res;
      this.understoodConceptsObj.forEach((el) => {
        this.allConceptsObj = this.allConceptsObj.map((e) =>
          e.id === el.id ? el : e
        );
      });
    });
  }
  
  ngOnInit(): void {
    console.log('MaterialModels.MODEL_1', MaterialModels.MODEL_1);
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
      }
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

    // this.allConceptsObj = [...this.concepts1];
    // this.loadResultForSelectedModel(MaterialModels.MODEL_1);
    this.loadResultForSelectedModel();
  }

  setChipConcept(concept): void {
    this.conceptFromChipObj = {
      id: concept.id,
      cid: concept.cid, // deal with cid instead of id 'AMR'
      name: concept.name,
      status: concept.status === 'understood' ? 'notUnderstood' : 'understood',
    };
  }

  // Only sort resoources on the frontend part
  sortResourcesByKeys(key: string) {
    console.warn("sortResult", this.croSorting);
    if (key !== "") {
      this.croSorting[key].arrow = !this.croSorting[key].arrow;
    }

    // filter the attributes selected
    let sortByParams = [];
    for (let [key, value] of Object.entries(this.croSorting)) {
      if (value.status == true && value.arrow === true) {
        sortByParams.push({ "property": key, "order": "desc" });
      } else if (value.status == true && value.arrow === false) {
        sortByParams.push({ "property": key, "order": "asc" });
      }
    }

    // Sorting ...
    for (let [key, nodes] of Object.entries(this.resourcesPagination.nodes)) {
      // resourcesSorted[key] = this.dynamicSortResource(nodes, sortByParams);
      nodes = this.dynamicSortResource(nodes, sortByParams);
    }
  }

  dynamicSortResource(array, sortBy) {
    return array.sort((a, b) => {
      return sortBy.reduce((result, current) => {
        if (result !== 0) return result;
  
        const { property, order = 'asc' } = current;
        let comparison = 0;
        
        let valueA = null;
        let valueB = null;

        if (property === "publish_time") {
          valueA = new Date(a[property]);
          valueB = new Date(b[property]);
        } else {
          valueA = a[property];
          valueB = b[property];
        }
  
        if (valueA > valueB) {
          comparison = 1;
        } else if (valueA < valueB) {
          comparison = -1;
        }
  
        if (order === 'desc') {
          comparison *= -1;
        }
  
        return comparison;
      }, 0);
    });
  }

  /*
  paginateResult() {
    // let pagination_params = {
    //   page_number: this.croPaginatorFirst + 1,
    //   page_size: 10,
    //   sort_by_params: this.croSorting
    // }

    let params_articles = {
                            page_number: 1,
                            page_size: 10
                        };
    let params_videos = {
                          page_number: 1,
                          page_size: 10
                        };
    if (this.activeIndex == 0) {
      params_articles["page_number"] = this.croPaginatorFirst + 1
    } else if (this.activeIndex == 1) {
      params_videos["page_number"] = this.croPaginatorFirst + 1
    }

    // let croForm = this.croComponent?.croForm; //this.croComponent?.getOnlyStatusChecked();
    // this.croForm["pagination_params"] = pagination_params;
    this.croForm["pagination_params"]["articles"] = params_articles;
    this.croForm["pagination_params"]["videos"] = params_videos;
    this.materialsRecommenderService.getRecommendedMaterials(
      null, this.croForm
    ).subscribe({
      next: (result) => {
        this.resourcesPagination = result;
        this.loadResultForSelectedModel();
      },
      error: (error) => {
          console.log('Error:', error);
          // this.displayMessage(error.message);
          // this.isLoading = false;
          // this.loading.emit(false);
        }
      })
  }
  */

  loadResultForSelectedModel() {
    // let key = null; // this.croForm[""];
    // for (const [key, value] of Object.entries(this.croForm["recommendation_types"]["models"])) {
    //   console.log(`${key}: ${value}`);
    // }

    this.allConceptsObj = [...this.resourcesPagination.concepts];
    this.concepts = [...this.resourcesPagination.concepts];
    if (this.croComponent?.didNotUnderstandConceptsObj && this.croComponent?.previousConceptsObj) {
      const didNotUnderstandConceptsObj = this.croComponent?.didNotUnderstandConceptsObj;
      const previousConceptsObj = this.croComponent?.previousConceptsObj;
      this.concepts.forEach((el, index, array) => {
        if (
          didNotUnderstandConceptsObj.some(
            (concept) => concept.cid === el.cid
          )
        ) {
          el.status = 'notUnderstood';
          array[index] = el;
        } else if (
          previousConceptsObj.some(
            (concept) => concept.cid === el.cid
          )
        ) {
          el.status = 'notUnderstood';
          array[index] = el;
        } else if (
          this.understoodConceptsObj.some(
            (concept) => concept.cid === el.cid
          )
        ) {
          el.status = 'understood';
          array[index] = el;
        } else {
          el.status = 'unread';
          array[index] = el;
        }
      });
    }

    /*
    // this.croVideos = this.resourcesPagination?.nodes?.vdieos;
    // this.croArticles = this.resourcesPagination?.nodes?.articles;
    // this.recievedVideoResultIsEmpty = false ? this.croVideos.total_items > 0 : true;
    // this.recievedArticleResultIsEmpty = false ? this.croArticles.total_items > 0 : true;
    // this.onResize();
    // console.log('recievedVideoResultIsEmpty', this.resourcesPagination.nodes.vdieos);
    // console.log('recievedArticleResultIsEmpty', this.articles);
    */
    // console.log('pagination results', this.resourcesPagination);
  }

  tabChanged(tab) {
    this.activeIndex = tab;

    // Pause videos (if any) when changing tabs
    document.querySelectorAll('iframe').forEach((iframe) => {
      const result = iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
    });

    this.deactivateDnuInteraction();
    // this.getConceptsMidsSliderNumbersForUserResourcesFiltering()
  }

  deactivateDnuInteraction() {
    // Deactivate Left Panel while interacting with Filtering on Tab "Saved"

    let leftPanelf = document.getElementById("ipo_interact");
    // console.warn("leftPanelf");
    // console.warn(leftPanelf);
    // console.warn(this.activeIndex);

    if (this.activeIndex === 2) {
      leftPanelf.classList.add('left_panel_interaction');
    } else {
      leftPanelf.classList.remove('left_panel_interaction');
    }
  }
  
  /*
  selectMainConceptsOnChange(event, type: number) {
    // call available Main Concepts
    if (event.value) {
      let value = event.value;
      const conceptFound = this.mainConceptsFiltered.find((concept) => concept.cid === value.cid);


      if (type === 1) {
      } else if ( type === 2) {
      } else if ( type === 3) {
        const slider_node = this.sliderNumbersSource.find((slide) => slide.name === value.cid);
      }

      if (conceptFound === undefined) {
        value.status = true;
        this.mainConceptsFiltered.push(value);
      } else {
        this.mainConceptsFiltered = this.mainConceptsFiltered.filter(concept => concept.id !== conceptFound.cid);
      }
    }

    this.filteringParamsSavedTab.cids = this.mainConceptsFiltered.map(concept => concept.cid);
    console.warn(this.filteringParamsSavedTab)
  }
  
  selectLearningMaterialsOnChange(event) {
    // call available Learning materials
  }

  selectSliderNumberOnChange(event) {
    // call available Silde / Page numbers
  }

  selectFilteringParamsOnChange(event, type: number) {
    if (event.value) {
      let value = event.value;
      
      if (type === 1) {
        let conceptFound = this.resourcesSaved.cids.find((concept) => concept.cid === value.cid);

        if (conceptFound === undefined) {
          value.status = true;
          this.filteringParamsSavedTab.cids.push(value);
        } else {
          this.filteringParamsSavedTab.cids = this.filteringParamsSavedTab.cids.filter(concept => concept.id !== conceptFound.cid);
        }

      } else if ( type === 2) {
        let midFound = this.resourcesSaved.mids.find((lm) => lm.mid === value.mid);

        if (midFound === undefined) {
          value.status = true;
          this.filteringParamsSavedTab.mids.push(value);
        } else {
          this.filteringParamsSavedTab.mids = this.filteringParamsSavedTab.mids.filter(lm => lm.mid !== midFound.mid);
        }
        
      } else if ( type === 3) {
        let sliderNumberFound = this.resourcesSaved.slider_numbers.find((sn) => sn.name === value.name);


        if (sliderNumberFound === undefined) {
          value.status = true;
          this.filteringParamsSavedTab.slider_numbers.push(value);
        } else {
          this.filteringParamsSavedTab.slider_numbers = this.filteringParamsSavedTab.slider_numbers.filter(sn => sn.name !== sliderNumberFound.name);
        }
      }
      
      

    }
  }

  getConceptsMidsSliderNumbersForUserResourcesFiltering() { // cids: string[], mids: string[], slider_numbers: string[]
    this.filteringParamsSavedTab.user_id = this.userId;
    // this.filteringParamsSavedTab.cids = cids;
    // this.filteringParamsSavedTab.mids = mids;
    // this.filteringParamsSavedTab.slider_numbers = slider_numbers;
    this.materialsRecommenderService.getConceptsMidsSliderNumbersForUserResourcesFiltering(this.filteringParamsSavedTab)
      .subscribe((data: UserResourceFilterParamsResult) => {
        this.resourcesSaved = data;

        // add status: true | false
      });
  }


  */

  /*
  sortElements(
    a: ArticleElementModel | VideoElementModel,
    b: ArticleElementModel | VideoElementModel
  ): number {
    const likeDislikeRatioForA = a.helpful_counter - a.not_helpful_counter;
    const likeDislikeRatioForB = b.helpful_counter - b.not_helpful_counter;

    if (likeDislikeRatioForA === likeDislikeRatioForB) {
      return a.similarity_score > b.similarity_score ? -1 : 1;
    } else {
      return likeDislikeRatioForA > likeDislikeRatioForB ? -1 : 1;
    }
  }

  loadResultForSelectedModel_old(key): void {
    this.results = [];
    this.videos = [];
    this.articles = [];

    if (key === '1') {
      this.results = this.results1;
      this.concepts = this.concepts1;
      this.allConceptsObj = [... this.concepts1];
    } else if (key === '2') {
      this.results = this.results2;
      this.concepts = this.concepts1;
      this.allConceptsObj = [... this.concepts1];
    } else if (key === '3') {
      this.results = this.results3;
      this.concepts = this.concepts2;
      this.allConceptsObj = [... this.concepts2];
    } else if (key === '4') {
      this.results = this.results4;
      this.concepts = this.concepts2;
      this.allConceptsObj = [... this.concepts2];
    } else {
      this.results = this.results1;
    }

    try{
      this.results.forEach((element: any) => {
        const e = element.data;
        if (e.labels.includes('Video')) {
          this.videos.push(e as VideoElementModel);
        } else {
          this.articles.push(e as ArticleElementModel);
        }
      });

      this.videos = this.videos.sort((a, b) => this.sortElements(a, b));
      this.articles = this.articles.sort((a, b) => this.sortElements(a, b));

      if (this.videos) {
        this.recievedVideoResultIsEmpty = false;
      }else{
        this.recievedVideoResultIsEmpty = true;
      }
      if (this.articles) {
        this.recievedArticleResultIsEmpty = false;
      }else{
        this.recievedArticleResultIsEmpty = true;
      }

    }catch (e){
      console.log(e);
    }

    console.log('ResultViewComponent Videos', this.videos);
    console.log('ResultViewComponent Articles', this.articles);
  }
  */
  // onResize() {
  //   if (window.screen.height >= 992 && window.screen.width >= 1024) {
  //     this.scrollPanelHeight = '550px';
  //   }
  // }
}
