import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ActivatorPartCRO, CROform, Neo4jResult, FactorWeight } from 'src/app/models/croForm';
import { CustomRecommendationOptionService } from 'src/app/services/custom-recommenation-option.service';


@Component({
  selector: 'app-custom-recommendation-option',
  templateUrl: './custom-recommendation-option.component.html',
  styleUrls: ['./custom-recommendation-option.component.css']
})
export class CustomRecommendationOptionComponent implements OnChanges, OnInit {
  @Input() userId: string;
  @Input() materialId: string;
  @Input() slideId: number = 1;
  @Input() didNotUnderstandConceptsObj: any [] = [];
  @Input() previousConceptsObj: any [] = [];
  @Input() activatorPartCRO: ActivatorPartCRO;
  // @Output() croFormValue: any; //  = new EventEmitter<CROform>();

  isCustomRecOptionDisplayed = true;
  cro_concept_weight: number;
  cro_concept_selected: any | undefined;
  // cro_concept_status_selected: boolean;
  croForm: any = {
    user_id: null,
    mid: null,
    slide_id: null,
    category: "1",
    concepts: [],
    recommendation_type: "1",
    factor_weights: {
      status: false,
      reload: true,
      weights: null
    }
  };

  factor_weight_checked = true;
  factor_weights = {
    original : [
      {
        "title": "Similarity Score",
        "key": "similarity_score",
        "value": 0.7,
        "checked": true
      },
      {
        "title": "Creation Date",
        "key": "creation_date",
        "value": 0.3,
        "checked": true
      },
      {
        "title": "No. of Views",
        "key": "views",
        "value": 0.3,
        "checked": true
      },
      {
        "title": "No. of Likes on YouTube",
        "key": "like_count",
        "value": 0.1,
        "checked": true
      },
  
      {
        "title": "User Rating on CourseMapper",
        "key": "user_rating",
        "value": 0.1,
        "checked": true
      },
      {
        "title": "No. of Saves on CourseMapper",
        "key": "saves_count",
        "value": 0.1,
        "checked": true
      }
    ],
    normalized: {
      "similarity_score": 0.44,
      "creation_date": 0.19,
      "views": 0.19,
      "like_count": 0.06,
      "user_rating": 0.06,
      "saves_count": 0.06
    }
  }

  croFormBackup: CROform = {};
  numberConceptsToBeChecked = 0;
  CROconceptsManually = []; // from the whole material
  // CROconceptsManuallySelection1or2 = []; // from the whole slide
  
  CROconceptsManuallySelection1 = []; // from the whole slide
  CROconceptsManuallySelection2 = []; // from the whole material

  isAddMoreConceptDisplayed = false;
  isMoreThan5ConceptDisplayed = false;
  seeMore = true;
  tmpCroFormConcepts = [];

  croFormObj = new BehaviorSubject<CROform>(this.croForm);

  constructor(
    private croService: CustomRecommendationOptionService,
    // private slideConceptservice: SlideConceptsService
  ) {
    // this.get_concepts_manually();
    // this.get_concepts_manually_current_slide();
    this.croFormObj.next(this.croForm);
  }

  ngOnInit(): void {
    this.croForm["user_id"] = this.userId;
    this.croForm["mid"] = this.materialId;
    this.croForm["slide_id"] = this.slideId;

    // if (this.croForm.concepts.length > 5) {
    //   this.seeMore = false;
    // }

    this.croFormObj.subscribe(data => {
      // console.warn("this.croFormObj ->", data);
    })
  }

  showCRO() {
    this.isCustomRecOptionDisplayed = this.isCustomRecOptionDisplayed === true ? false : true;
  }
  
  updateFactorWeight() {
    let data = this.getFactorWeight();
    this.croService.updateFactorWeight(data).subscribe((res) => {
      this.factor_weights.normalized = res;
    })
  }

  getFactorWeight() {
    let result = {};
    for (let factor of this.factor_weights.original) { 
      if (factor.checked === true) {
        result[factor.key] = factor.value
      }
    }

    this.croForm.factor_weights.weights = result;
    return result
  }
  
  showRecTypeAndFactorWeight() {
    this.croForm.factor_weights.status = this.croForm?.concepts.length > 0 ? true : false;
  }

  activateOrNotFactorWeight(event, factor_index: number) {
    let factor_div = document.getElementById("factor_weight_"+factor_index);

    if (event.checked === true) {
      factor_div.classList.remove('factor_weight_disabled');
    } else {
      factor_div.classList.add('factor_weight_disabled');
    }

    this.updateFactorWeight();
  }


  debugCRO(name: string, obj, hide = false) {
    if (hide) {
      console.warn(`CRO -> ${name} -> `, obj)
    }
  }

  resetCROform() {
    const user_id = this.croForm.user_id;
    const mid = this.croForm.mid;
    const category = this.croForm.category;
    const slide_id = this.croForm.slide_id;

    this.croForm = {
      user_id: user_id,
      mid: mid,
      slide_id: slide_id,
      category: category,
      concepts: [],
      recommendation_type: "1",
      pagination_params: null
    }
  }


  get_concepts_manually_current_slide() {
    if (this.slideId) {
      if (this.CROconceptsManuallySelection1.length <= 0) {
        const currentSlide = `${this.materialId}_slide_${this.slideId.toString()}`;
        this.croService.getConceptsBySlideId(currentSlide, this.userId).subscribe((res: Neo4jResult) => {
          this.CROconceptsManuallySelection1 = res.records;
        })
      }
    }
  }

  get_concepts_manually() {
    if (this.materialId) {
      if (this.CROconceptsManually.length == 0) {
        this.croService.getConceptsBYmid(this.materialId, this.userId).subscribe((res: Neo4jResult) => {
          this.CROconceptsManually = res.records;
        });
      }
    }
  }

  reset_concepts_list() {
    this.CROconceptsManually.forEach(x => {if (x.status === true) x.status = false });
    this.CROconceptsManuallySelection1.forEach(x => {if (x.status === true) x.status = false });
    this.CROconceptsManuallySelection2.forEach(x => {if (x.status === true) x.status = false });
    // this.get_concepts_manually_current_slide();
  }

  updateNumberConceptsToBeChecked() {
    if (this.croForm.concepts.length > 0) {
      // sort concepts based on the weight
      // let sortedConcepts = this.croForm.concepts.sort((a, b) => b.weight - a.weight);
      // this.croForm.concepts = sortedConcepts;

      let count = 0;
      for (let i = 0; i < this.croForm.concepts.length; i++) {
        let node = this.croForm.concepts[i];
        if (node["status"] === true) {
          count += 1;
        }

        // check 5 default concepts 
        if (i < 5) {
          // node["status"] = true;
        } else if (i >= 5) {
          node["status"] = false;
        }
      }
      this.numberConceptsToBeChecked = 5 - count;
    }


    // organize the list by weigth
    // this.dynamicConceptAdded();

    // Sort by status
    //  this.croForm.concepts.sort((a, b) => b.status - a.status);

    // this.croForm.countOriginal = this.croForm.concepts.length;
    this.croFormObj.next(this.croForm);
  }

  mapConcept(cids: string[], conceptsList: any[]) {
    console.warn("cids ->", cids);
    console.warn("conceptsList ->", conceptsList);


    let concepts = [];
    for(let id of cids) {
      // deep copy of conceptsManuallyOriginal
      // let conceptsManuallyOriginalCopied = JSON.parse(JSON.stringify(this.conceptsManuallyOriginal));

      for(let node of conceptsList) {
        if (id === node.cid) {
          node["status"] = true;
          node["visible"] = true;
          concepts.push(node);
        }
      }

      this.croForm.concepts = concepts;
      // this.dynamicConceptAdded();
      // this.updateNumberConceptsToBeChecked();
    }
  }

  updateCROform(conceptsObj: any[], category: string) {
    // this.debugCRO("updateCROform -> this.materialId", this.materialId, true);

    if (this.materialId) {
      this.croForm.concepts = [];
      let cids = [];

      if ((category === "1" || category === "2") && conceptsObj) {
        cids = conceptsObj.map((x) => x.cid);
      }

      if (category === "1") {
        this.mapConcept(cids, this.CROconceptsManuallySelection1);

      } else if (category === "2") {
        this.mapConcept(cids, this.CROconceptsManuallySelection2);

      } else if (category === "3") {
        this.get_concepts_manually();
      }
    }

    // this.updateNumberConceptsToBeChecked();
    // this.showRecTypeAndFactorWeight();
  }

  updateCROformAll(didNotUnderstandConceptsObj, previousConceptsObj) {
    if (this.croForm.category === "1") {
      this.updateCROform(didNotUnderstandConceptsObj, "1");

    } else if (this.croForm.category === "2") {
      this.updateCROform(previousConceptsObj, "2");

    } else if (this.croForm.category === "3") {
      this.updateCROform(undefined, "3");

    } else {
      this.croForm.category === "1"
      this.updateCROform(didNotUnderstandConceptsObj, "1");
    }

    this.updateStatus1or2();
  }

  updateStatus1or2() {
    if (this.croForm.category === "1") { 
      for (let concept of this.croForm.concepts) {
        for (let node of this.CROconceptsManuallySelection1) {
          if (concept.cid === node.cid) {
            node["status"] = concept["status"]
            break;
          }
        }
      }
    } else if (this.croForm.category === "2") { 
      for (let concept of this.croForm.concepts) {
        for (let node of this.CROconceptsManuallySelection2) {
          if (concept.cid === node.cid) {
            node["status"] = concept["status"]
            break;
          }
        }
      }
    }
  }

  setCROcategory(event) {
    this.croForm.category = event.value;
    this.resetCROform()
    this.reset_concepts_list();
    this.isAddMoreConceptDisplayed = false;
    this.isMoreThan5ConceptDisplayed = false;
    
    if (this.croForm.category === "1") {
      this.updateCROform(this.didNotUnderstandConceptsObj, "1")

    } else if (this.croForm.category === "2") {
      // console.warn("previousConceptsObj ->", this.previousConceptsObj);
      this.updateCROform(this.previousConceptsObj, "2");

    } else if (this.croForm.category === "3") {
      this.updateCROform(undefined, "3");
    }

    this.updateStatus1or2();
  }

  /*
  setWeight(event, cro) {
    for (let i = 0; i < this.croForm.concepts.length; i++) {
      let x = this.croForm.concepts[i];
      if (x.cid == cro.cid) {
        let value = Number(event.value);
        cro.weight_updated = value;
        cro.weight = (value / 100); // .toFixed(2);
        break;
      }
    }
    // console.warn(this.croForm.concepts);
  }
  */

  setStatus(event, cro) {
    this.deactivateSelection();
    // this.updateNumberConceptsToBeChecked();
  }

  selectTopConcept() {
    let sortedConcepts = [];
    sortedConcepts = this.croForm.concepts.sort((a, b) => b.weight - a.weight);
    this.croForm.concepts = sortedConcepts; // sortedConcepts.slice(0, 5);
  }

  displayAddMoreConcept() {
    this.isAddMoreConceptDisplayed = this.isAddMoreConceptDisplayed === true ? false : true;
  }

  displaySeeMore() {
    this.seeMore = this.seeMore === true ? false : true;
    for (let i = 2; i < this.croForm.concepts.length; i++) {
      // console.warn(this.croForm.concepts[i])

      if (this.seeMore === false) {
        this.croForm.concepts[i]["visible"] = false;
      } else {
        this.croForm.concepts[i]["visible"] = true;
      }
    }
  }

  deactivateSelection() {
    let conceptsWithStatusTrue = this.croForm.concepts.filter(x => x.status === true)
    if (conceptsWithStatusTrue.length > 5) {
      this.isMoreThan5ConceptDisplayed = true;
    } else {
      this.isMoreThan5ConceptDisplayed = false;
    }
  }

  setSelectManuallyOnChange(event) {
    this.deactivateSelection();
   
    if (event.value) {
      let value = event.value;
      const conceptFound = this.croForm.concepts.find((concept) => concept.cid === value.cid);

      if (conceptFound === undefined) {
        value["status"] = true;
        value["visible"] = true;
        this.croForm.concepts.push(value);

        // this.getConceptsModifiedByUserIdAndCids();
      } else {
        for(let concept of this.croForm.concepts) {
          if (value.cid === concept.cid) {
            concept.status = !value.status;
            concept.visible = !value.status;
            break
          }
        }
      }
    }
    // this.updateNumberConceptsToBeChecked();
  }

  removeSelectManuallyOnChange(index: number, cid: string) {
    if (index > -1) {
      this.croForm.concepts.splice(index, 1);

      for (let node of this.CROconceptsManually) {
        if (cid === node.cid) {
          node.status = false;
          node.visible = false;
          break;
        }
      }
    }
    // this.updateNumberConceptsToBeChecked();
  }

  getOnlyStatusChecked() {
    let concepts = [];
    for(let concept of this.croForm.concepts) {
      if (concept.status === true) {
        concepts.push(concept);
      }
    }
    this.croForm.concepts = concepts;

    // update factor weights
    this.getFactorWeight();

    // check if factor weights changed
    // this.reloadRankingLogicFactorWeight();

    return this.croForm;
  }
  
  ngOnChanges(changes: SimpleChanges) {    
    for (const propName in changes) {
      // console.warn("CRO ngOnChanges ->", propName)

      if (propName === "materialId") {
        this.get_concepts_manually();
      }
      if (propName === "slideId") {
        this.get_concepts_manually_current_slide();
      }
      this.updateCROformAll(this.didNotUnderstandConceptsObj, this.previousConceptsObj);
      console.warn("previousConceptsObj ->", this.previousConceptsObj)
      // this.getConceptsModifiedByUserIdAndCids();
    }
    // this.showRecTypeAndFactorWeight();
  }

  /**
  getConceptsModifiedByUserIdAndCids() {
    let cids = this.croForm?.concepts.map((concept) => concept.cid);
    this.croService.getConceptsModifiedByUserIdAndCids(this.userId, cids.toString()).subscribe((res: Neo4jResult) => {
      this.CROconceptsManuallySelection1 = res.records;
      this.croForm.concepts.forEach((concept) => {
        for(let record of res.records) {
          if (concept.cid == record.cid) {
            concept.weight = record.weight;
            break
          }
        }
      });
    })
  }


  reloadRankingLogicFactorWeight() {
    let jsonString = localStorage.getItem('cro_ranking_factor_weights');

    if (jsonString) {
      if (JSON.stringify(this.croForm.factor_weights) !== JSON.stringify(JSON.parse(this.croForm.factor_weights))) {
        localStorage.setItem('cro_ranking_factor_weights', this.croForm.factor_weights);
      } else {
        this.croForm.factor_weights.reload = true;
        localStorage.setItem('cro_ranking_factor_weights', this.croForm.factor_weights);
      }
    }
  }
   */

}
