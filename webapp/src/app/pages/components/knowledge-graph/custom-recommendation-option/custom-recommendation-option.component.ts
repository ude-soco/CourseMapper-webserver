import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MessageService } from 'primeng/api';
import { BehaviorSubject } from 'rxjs';
import { ActivatorPartCRO, CROform, Neo4jResult } from 'src/app/models/croForm';
import { CustomRecommendationOptionService } from 'src/app/services/custom-recommenation-option.service';


export interface factorWeights {
  original: any[],
  normalized: {
    like_count?: number;
    creation_date?: number;
    views?: number;
    similarity_score?: number;
    saves_count?: number;
    user_rating?: number;
  }
};


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
  @Input() conceptsUpdated: any;

  isCustomRecOptionDisplayed = true;
  cro_concept_weight: number;
  cro_concept_selected: any | undefined;
  croForm: any = {
    user_id: null,
    mid: null,
    slide_id: null,
    category: "1",
    concepts: [],
    recommendation_type: "1",
    factor_weights: null,
    pagination_params: { "page_number": 1, "page_size": 10 }
  };

  factor_weight_checked = true;
  factor_weights: factorWeights = {
    original : null,
    normalized: null
  }

  croFormBackup: CROform = {};
  numberConceptsToBeChecked = 0;
  CROconceptsManually = []; // from the whole material
  
  CROconceptsManuallySelection1 = []; // from the whole slide
  CROconceptsManuallySelection2 = []; // from the whole material

  isAddMoreConceptDisplayed = false;
  isMoreThan5ConceptDisplayed = false;
  seeMore = true;
  tmpCroFormConcepts = [];

  croFormObj = new BehaviorSubject<CROform>(this.croForm);

  // result component
  resultTabSelected: number = 1;
  factorsTabArticle = ["similarity_score", "saves_count", "user_rating"];
  deactivateAlgo3and4 = false;

  @Input() data: any[] = [];
  @Input() DNUCurrent: any[] = [];
  @Input() DNUPrevious: any[] = [];

  constructor(
    private croService: CustomRecommendationOptionService,
    private messageService: MessageService
  ) {
    this.croFormObj.next(this.croForm);

    this.factor_weights.original = [
      {
        "title": "Similarity Score",
        "key": "similarity_score",
        "value": 0.169000934,
        "checked": true,
        "deactivated": false
      },
      {
        "title": "Creation Date on YouTube",
        "key": "creation_date",
        "value": 0.141456583,
        "checked": true,
        "deactivated": false
      },
      {
        "title": "No. of Views on YouTube",
        "key": "views",
        "value": 0.186741363,
        "checked": true,
        "deactivated": false
      },
      {
        "title": "No. of Likes on YouTube",
        "key": "like_count",
        "value": 0.177404295,
        "checked": true,
        "deactivated": false
      },
  
      {
        "title": "User Rating on CourseMapper",
        "key": "user_rating",
        "value": 0.18627451,
        "checked": true,
        "deactivated": false
      },
      {
        "title": "No. of Saves on CourseMapper",
        "key": "saves_count",
        "value": 0.139122316,
        "checked": true,
        "deactivated": false
      }
    ];
    this.factor_weights.normalized = {   
      'like_count': 0.177404295, 
      'creation_date': 0.141456583, 
      'views': 0.186741363, 
      'similarity_score': 0.169000934, 
      'saves_count': 0.139122316, 
      'user_rating': 0.18627451
    }
  }

  ngOnInit(): void {
    localStorage.removeItem('resultTabSelected');
    this.croForm["user_id"] = this.userId;
    this.croForm["mid"] = this.materialId;
    this.croForm["slide_id"] = this.slideId;

    this.croService.isResultTabSelected$.subscribe(tabSelected => {
      if (tabSelected === '0') {
        this.factor_weights.original.forEach(factor => {
            factor.checked = true;
            factor.deactivated = false;
        })
      }
      else if (tabSelected === '1') {
        for (let factor of this.factor_weights.original) {
          if (this.factorsTabArticle.includes(factor.key) === true) {
            factor.checked = false;
            factor.deactivated = true;
          }
        }
      }
    });
  }

  updateConcpetAfterRecommandation() {
    // this.croForm.concepts = this.conceptsUpdated;
    for (let conceptU of this.conceptsUpdated) {
      for (let concept of this.croForm.concepts) {
        if (conceptU.cid === concept.cid) {
          concept.weight = conceptU.weight;
        } else {
          concept.status = false;
        }
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      if (propName === "materialId") {
        this.getConceptsManually();
      }
      if (propName === "slideId") {
      }
      this.updateCROformAll(this.didNotUnderstandConceptsObj, this.previousConceptsObj);
    }
  }

  showCRO() {
    this.isCustomRecOptionDisplayed = this.isCustomRecOptionDisplayed === true ? false : true;
  }
  
  sortDictBykey(data) {
    const sorted = Object.keys(data)
    .sort()
    .reduce((acc, key) => {
      acc[key] = data[key];
      return acc;
    }, {});

    return sorted;
  }


  updateFactorWeight() {
    let data = this.getFactorWeight();
    this.factor_weights.normalized = this.normalizeFactorWeights(data, [], "l1", true, true) as {   like_count?: number;   creation_date: number;   views: number;   similarity_score: number;   saves_count: number;   user_rating: number; };;
  }

  getFactorWeight() {
    let result = {};
    for (let factor of this.factor_weights.original) { 
      if (factor.checked === true) {
        result[factor.key] = factor.value
      }
    }

    this.croForm.factor_weights = result;
    // this.croForm.factor_weights.weights = result;
    return result
  }
  
  // showRecTypeAndFactorWeight() {
  //   this.croForm.factor_weights.status = this.croForm?.concepts.length > 0 ? true : false;
  // }

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
      factor_weights: this.factor_weights,
      pagination_params: null
    }
  }

  getConceptsByCids(cids: string) {
    this.croService.getConceptsByCids(this.userId, cids).subscribe((res: Neo4jResult) => {
      for (let record of res.records) {
        for (let concept of this.croForm.concepts) {
          if (concept.cid === record.cid) {
            concept["weight"] = record.weight;
            break;
          }
        }
      }
      // this.croForm.concepts = res.records;
    });
  }

  getConceptsManually() {
    if (this.materialId) {
      if (this.CROconceptsManually.length == 0) {
        this.croService.getConceptsModifiedByUserIdAndMid(this.materialId, this.userId).subscribe((res: Neo4jResult) => {
          this.CROconceptsManually = res.records;
        });
      }
    }
  }

  resetConceptsList() {
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
    this.croFormObj.next(this.croForm);

    /**
     organize the list by weigth
    this.dynamicConceptAdded();

    Sort by status
    this.croForm.concepts.sort((a, b) => b.status - a.status);

    this.croForm.countOriginal = this.croForm.concepts.length;
    */
  }

  addDictsIfNotExists(newDictsArray) {
    newDictsArray.forEach(newDict => {
        const exists = this.croForm.concepts.some(dict => dict.cid === newDict.cid);
        if (!exists) {
          newDict["status"] = true;
          newDict["visible"] = true;
          this.croForm.concepts.push(newDict);
        }
    });
  }

  mapConcept(cids: string[], conceptsList: any[]) {
    this.croService.getConceptsByCids(this.userId, cids.toString()).subscribe((res: Neo4jResult) => {
      this.croForm.concepts = res.records;
      for(let concept of this.croForm.concepts) {
        concept["status"] = true;
        concept["visible"] = true;
      }
    });

    /*
      // deep copy of conceptsManuallyOriginal
      // let conceptsManuallyOriginalCopied = JSON.parse(JSON.stringify(this.conceptsManuallyOriginal));  
    let concepts = [];
    for(let id of cids) {
    for(let node of conceptsList) {
        if (id === node.cid) {
          node["status"] = true;
          node["visible"] = true;
          concepts.push(node);
        }
      }
      this.croForm.concepts = concepts;
    }
    // this.dynamicConceptAdded();
    // this.updateNumberConceptsToBeChecked();
    */
  }

  areArraysEqualById(array1, array2) {
    // Check if arrays have the same length
    if (array1.length !== array2.length) {
      return false;
    }
  
    // Create Sets of IDs from both arrays
    const idSet1 = new Set(array1.map(item => item.id));
    const idSet2 = new Set(array2.map(item => item.id));
  
    // Check if the Sets have the same size
    if (idSet1.size !== idSet2.size) {
      return false;
    }
  
    // Check if every ID in idSet1 is also in idSet2
    for (let id of idSet1) {
      if (!idSet2.has(id)) {
        return false;
      }
    }
  
    // If we've made it this far, the arrays are equal
    return true;
  }
  
  updateCROform(conceptsObj: any[], category: string) {
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
      } 

      else if (category === "3") {
        this.getConceptsManually();
      }
    }
  }
  
  updateCROformAll(didNotUnderstandConceptsObj, previousConceptsObj) {
    if (this.croForm.category === "1") {
      this.updateCROform(didNotUnderstandConceptsObj, "1");

    } else if (this.croForm.category === "2") {
      let previousDNU;
      if (previousConceptsObj) {
        previousDNU = previousConceptsObj;
      } else {
        previousDNU = this.previousConceptsObj;
      }
      this.updateCROform([...didNotUnderstandConceptsObj, ...previousDNU], "2");

    } else if (this.croForm.category === "3") {
      this.updateCROform(undefined, "3");

    } else {
      this.croForm.category === "1"
      this.updateCROform(didNotUnderstandConceptsObj, "1");
    }
  }

  combine2ConceptsList(arrayA, arrayB) {
    arrayA.forEach(itemA => {
      const existsInB = arrayB.some(itemB => itemB.cid === itemA.cid);
      if (!existsInB) {
        arrayB.push(itemA);
      }
    });
    return arrayA;
  }

  setCROcategory(event) {
    this.croForm.category = event.value;
    this.resetCROform()
    this.resetConceptsList();
    this.isAddMoreConceptDisplayed = false;
    this.isMoreThan5ConceptDisplayed = false;
    
    if (this.croForm.category === "1") {
      this.updateCROform(this.didNotUnderstandConceptsObj, "1");
      this.deactivateAlgo3and4 = false;

    } else if (this.croForm.category === "2") {
      this.updateCROform([...this.didNotUnderstandConceptsObj, ...this.previousConceptsObj], "2");
      this.deactivateAlgo3and4 = true;

    } else if (this.croForm.category === "3") {
      this.updateCROform(undefined, "3");
      this.deactivateAlgo3and4 = true;
    }
  }

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
    for (let i = 5; i < this.croForm.concepts.length; i++) {
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

  setSelectManuallyOnChangeMultiSelect(event) {
    let concept_selected = event.itemValue;
    if (concept_selected) {
      const index = this.croForm.concepts.findIndex(concept => concept.cid === concept_selected.cid);

      if (index !== -1) {
        this.croForm.concepts.splice(index, 1);
      } else {
        concept_selected["status"] = true;
        concept_selected["visible"] = true;
        this.croForm.concepts.push(concept_selected);
      }
    } else {
      if (event.value.length === this.CROconceptsManually.length) {
        this.croForm.concepts = event.value;
        this.croForm.concepts.forEach((concept) => {concept["status"]; concept["status"]});
      } else if (event.value.length === 0) {
        this.croForm.concepts = [];
      }
    }

    this.croForm.concepts.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
    this.deactivateSelection();
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
    this.messageService.add({ key: 'cro_concept_removed', severity: 'info', summary: '', detail: 'Concept removed'});
  }

  buildFinalRequestRecMaterial(reqData) {
    let concepts = [];
    for(let concept of this.croForm.concepts) {
      if (concept.status === true) {
        concepts.push(concept);
      }
    }

    this.getFactorWeight();
    let croFormRequest = {
      default: reqData,
      rec_params: JSON.parse(JSON.stringify(this.croForm))
    }
    croFormRequest.rec_params.concepts = concepts;

    // Store CRO Request Params
    localStorage.removeItem('resourcesPaginationParams');
    localStorage.setItem('resourcesPaginationParams', JSON.stringify(croFormRequest));
    
    return croFormRequest;
  }

  deactivateTabResultArticle(factorKey): void {
    const resultTabSelected = localStorage.getItem('resultTabSelected');
    if (resultTabSelected) {
      if (resultTabSelected === '1' && !this.factorsTabArticle.includes(factorKey) === true ) {
        for (let factor of this.factor_weights.original) {
          if (factor.key === factorKey) {
            factor.checked = false;
            break;
          }
        }
       // return true;
      }
    }
  }

  checkResultTabSelected(factorKey) {
    const resultTabSelected = localStorage.getItem('resultTabSelected');
    if (resultTabSelected) {
      if (resultTabSelected === '1' && !this.factorsTabArticle.includes(factorKey) === true ) {
        for (let factor of this.factor_weights.original) {
          if (factor.key === factorKey) {
            factor.checked = false;
            break;
          }
        }
        return true;
      }
    }
    for (let factor of this.factor_weights.original) {
      if (factor.key === factorKey) {
        factor.checked = true;
        break;
      }
    }
    return false;
  }

  deactivateAlgorithmOption() {
    if (this.croForm.category === '2' || this.croForm.category === '3') {
      return true;
    }
    return false;
  }


  normalizeFactorWeights(
    factorWeights: any, // Record<string, number> = {},
    values: number[] = [],
    methodType: string = 'l1',
    complete: boolean = true,
    sumValue: boolean = true
  ) // : Record<string, number> | number[] | {} 
  {
    // console.info('Normalization of factor weights');
    if (!factorWeights || Object.keys(factorWeights).length === 0) {
      return {};
    }

    let normalizedValues: number[] | null = null;
    let scaledData: number[] | null = null;

    if (factorWeights) {
      values = Object.values(factorWeights);
    }

    switch (methodType) {
      case 'l1':
        const l1Sum = values.reduce((acc, val) => acc + Math.abs(val), 0);
        normalizedValues = values.map((val) => +(val / l1Sum).toFixed(3));
        break;

      case 'l2':
        const l2Sum = Math.sqrt(values.reduce((acc, val) => acc + val * val, 0));
        normalizedValues = values.map((val) => +(val / l2Sum).toFixed(3));
        break;

      case 'max':
        const maxValue = Math.max(...values);
        normalizedValues = values.map((val) => +(val / maxValue).toFixed(3));
        break;

      case 'min-max':
        const minValue = Math.min(...values);
        const range = Math.max(...values) - minValue;
        scaledData = values.map((val) => +((val - minValue) / range).toFixed(3));
        normalizedValues = scaledData;
        break;
    }

    if (sumValue && normalizedValues) {
      // console.info('Factor weight sum ->', normalizedValues.reduce((acc, curr) => acc + curr, 0));
    }

    if (complete && normalizedValues) {
      const keyNames = Object.keys(factorWeights);
      const res = keyNames.reduce((acc, key, index) => {
        acc[key] = normalizedValues![index];
        return acc;
      }, {} as Record<string, number>);
      return res;
    }

    return normalizedValues || {};
  }

}
