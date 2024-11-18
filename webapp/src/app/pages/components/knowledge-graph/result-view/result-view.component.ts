import { Component, Input } from '@angular/core';
import { VideoElementModel } from '../videos/models/video-element.model';
import { ArticleElementModel } from '../articles/models/article-element.model';
import { MenuItem } from 'primeng/api';
// import { MaterialsRecommenderService } from 'src/app/services/materials-recommender.service';
import { Subscription } from 'rxjs';
import { SlideConceptsService } from 'src/app/services/slide-concepts.service';

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

  constructor(private slideConceptservice: SlideConceptsService) {
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

    this.loadResultForSelectedModel(MaterialModels.MODEL_1);

    this.didNotUnderstandConceptsObj = this.slideConceptservice.commonDidNotUnderstandConcepts;
    this.didNotUnderstandConceptsObj.forEach((el) => {
      this.allConceptsObj = this.allConceptsObj.map((e) =>
        e.id === el.id ? el : e
      );
    });

    this.understoodConceptsObj = this.slideConceptservice.commonUnderstoodConcepts;
    this.understoodConceptsObj.forEach((el) => {
      this.allConceptsObj = this.allConceptsObj.map((e) =>
        e.id === el.id ? el : e
      );
    });
  }

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

  setChipConcept(concept): void {
    this.conceptFromChipObj = {
      id: concept.id,
      cid: concept.cid, // deal with cid instead of id 'AMR'
      name: concept.name,
      status: concept.status === 'understood' ? 'notUnderstood' : 'understood',
    };
  }
  loadResultForSelectedModel(key): void {
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

  tabChanged(tab) {
    // Pause videos (if any) when changing tabs
    document.querySelectorAll('iframe').forEach((iframe) => {
      const result = iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
    })
  }
}
