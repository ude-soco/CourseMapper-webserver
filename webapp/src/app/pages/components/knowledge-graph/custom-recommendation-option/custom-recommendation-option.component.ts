import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ActivatorPartCRO, CROform, Neo4jResult } from 'src/app/models/croForm';
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

  isCustomRecOptionDisplayed = false;
  cro_concept_weight: number;
  cro_concept_selected: any | undefined;
  // cro_concept_status_selected: boolean;
  croForm: any = {
    user_id: null,
    mid: null,
    slide_id: null,
    category: "1",
    concepts: [],
    recommendation_types: {
      status: false,
      models: {
        recommendation_type_1: true,
        recommendation_type_2: false,
        recommendation_type_3: false,
        recommendation_type_4: false
      }
    },
    vennDiagramStatus: false,
    // countOriginal: 0,
    pagination_params: {
      articles: {
        page_size: 10,
        page_number: 1
      },
      videos: {
          page_size: 10,
          page_number: 1
      },
      // content: [],
      // total_pages: 2,
      sort_by_params: {
          similarity_score: true,
          most_recent: false,
          popularity: false
      }
    }
  };
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

  /*didNotUnderstandConceptsObjCRO = [
    {cid:"1", name: "Information Visualization Machine", weight: 0.3, status: false, weight_full: 30},
    {cid:"2", name: "Machine Learning", weight: 0.8, status: false, weight_full: 80},
    {cid:"3", name: "Machine", weight: 0.1, status: false, weight_full: 10},
  ];
  previousConceptsObjCRO = [
    {cid:"4", name: "Machine 2", weight: 0.1, status: false, weight_full: 10},
    {cid:"5", name: "Machine 3", weight: 0.4, status: false, weight_full: 40},
    {cid:"6", name: "Machine 5", weight: 0.15, status: false, weight_full: 15},
    {cid:"7", name: "Machine 6", weight: 0.7, status: false, weight_full: 70},
    {cid:"8", name: "Machine 7", weight: 0.25, status: false, weight_full: 25},
    {cid:"9", name: "Machine 8", weight: 0.3, status: false, weight_full: 30},
    {cid:"1", name: "Information Visualization Machine", weight: 0.3, status: false, weight_full: 30}
  ];
  */

  croFormObj = new BehaviorSubject<CROform>(this.croForm);

  constructor(
    private croService: CustomRecommendationOptionService,
    // private slideConceptservice: SlideConceptsService
  ) {
    // this.get_concepts_manually();
    // this.get_concepts_manually_current_slide();
    this.croFormObj.next(this.croForm);
  }

  /*
  constructor(
    private croService: CustomRecommendationOptionService,
    private localStorageService: LocalStorageService,
    private fb: FormBuilder
    // private slideConceptservice: SlideConceptsService
  ) {
    // this.get_concepts_manually();
    // this.get_concepts_manually_current_slide();

    // this.croFormObj = this.fb.group({
    //     category: [null],
    //     concepts: this.fb.array([]) // this.fb.array([this.createTicket()]) // this.fb.array([])
    // })
  }

  createTicket(): FormGroup{
    return this.fb.group({
      cid: ["22"],
      name: ["Gello"],
      status: [false],
      weight: [2],
      weight_full: [20]
    })
  }

  get concepts(): FormArray{
    return <FormArray> this.croFormObj.get('concepts');
  }

  addTicket() {
    this.concepts.push(this.createTicket());
  }

  addConcepts(concepts: any []): FormArray {
    let result: FormArray;
    for(let concept of concepts) {
      result.push(this.fb.group({
        cid: concept.cid,
        name: concept.name,
        status: concept.status,
        // weight: [null],
        // weight_full: [null]
      }));
    }

    return result;
  }
  
  ngOnInit(): void {
    // const stopsArray = this.croFormObj.get('stops') as FormArray;
    this.croFormObj.valueChanges.subscribe((selectedValue) => {console.warn("this.croFormObj -> ", selectedValue)});
  }
  */

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

  debugCRO(name: string, obj, hide = false) {
    if (hide) {
      console.warn(`CRO -> ${name} -> `, obj)
    }
  }

  resetCROform() {
    const user_id = this.croForm.user_id;
    const mid = this.croForm.mid;
    const category = this.croForm.category;
    const recommendation_algorithm = this.croForm.recommendation_algorithm;

    this.croForm = {
      user_id: user_id,
      mid: mid,
      category: category,
      concepts: [],
      recommendation_algorithm: recommendation_algorithm,
      vennDiagramStatus: false,
      // countOriginal: 0,
      pagination_params: {
        current_page: 1,
        total_items: 15,
        content: [],
        total_pages: 2,
        sort_by_params: {
            similarity_score: true,
            most_recent: false,
            popularity: false
        }
      }
    }
  }

  // mapConceptWithWeight(cids: string[]) {
  //   let concepts = [];
  //   for(let id of cids) {
  //     for(let node of this.conceptsManually) {
  //       let data = node;
  //       if (id === data.cid) {
  //         // data["weight_full"] = data.weight * 100
  //         data["status"] = true;
  //         concepts.push(data);
  //       }
  //     }
  //   }
  //   return concepts;
  // }

  mapConcept(cids: string[], conceptsList: any[]) {
    let concepts = [];
    for(let id of cids) {
      // deep copy of conceptsManuallyOriginal
      // let conceptsManuallyOriginalCopied = JSON.parse(JSON.stringify(this.conceptsManuallyOriginal));

      for(let node of conceptsList) {
        if (id === node.cid) {
          node["status"] = true;
          concepts.push(node);
        }
      }

      this.croForm.concepts = concepts;
      // this.dynamicConceptAdded();
      this.updateNumberConceptsToBeChecked();
    }
  }

  get_concepts_manually_current_slide() {
    if (this.slideId) {
      // console.warn("slideId -> ", this.slideId);

      if (this.CROconceptsManuallySelection1.length <= 0) {
        const currentSlide = `${this.materialId}_slide_${this.slideId.toString()}`;
        this.croService.getConceptsBySlideId(currentSlide).subscribe((res: Neo4jResult) => {
          this.CROconceptsManuallySelection1 = res.records;
          // this.localStorageService.saveData("CROconceptsManuallySelection1or2", res.records)
        })
      }
    }
  }

  get_concepts_manually() {
    if (this.materialId) {
      if (this.CROconceptsManually.length == 0) {
        this.croService.getConceptsBYmid(this.materialId).subscribe((res: Neo4jResult) => {
          this.CROconceptsManually = res.records;
          this.CROconceptsManuallySelection2 = JSON.parse(JSON.stringify(res.records));
          // this.localStorageService.saveData("CROconceptsManually", res.records)

          // for(let node of res.records) {
          //   let data = node;
          //   data["weight_full"] = data.weight * 100
          //   this.conceptsManually.push(data);
          // }
  
          // remove duplicate
          // this.conceptsManually = [...new Map(this.conceptsManually.map(v => [v.cid, v])).values()]
          
          // this can be done by the backend
          // sort asc by name
          // this.conceptsManually = this.conceptsManually.sort((a, b) => a.name.localeCompare(b.name));

          // make a copie
          // this.conceptsManuallyCopie = this.conceptsManually;
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

    this.updateNumberConceptsToBeChecked();
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
    // this.croForm.concepts = [];
    this.isAddMoreConceptDisplayed = false;
    this.isMoreThan5ConceptDisplayed = false;
    
    if (this.croForm.category === "1") {
      this.updateCROform(this.didNotUnderstandConceptsObj, "1")

    } else if (this.croForm.category === "2") {
      this.updateCROform(this.previousConceptsObj, "2");

    } else if (this.croForm.category === "3") {
      this.updateCROform(undefined, "3");
    }

    this.updateStatus1or2();
  }

  setWeight(event, cro) {
    for (let i = 0; i < this.croForm.concepts.length; i++) {
      let x = this.croForm.concepts[i];
      if (x.cid == cro.cid) {
        let value = Number(event.value);
        cro.weight_updated = value;
        cro.weight = value / 100;
        break;
      }
    }
    // console.warn(this.croForm.concepts);
  }

  setStatus(event, cro) {
    this.deactivateSelection();
    this.updateNumberConceptsToBeChecked();
  }

  selectTopConcept() {
    let sortedConcepts = [];
    sortedConcepts = this.croForm.concepts.sort((a, b) => b.weight - a.weight);
    this.croForm.concepts = sortedConcepts; // sortedConcepts.slice(0, 5);
  }

  // dynamicConceptAdded() {
  //   if (this.croForm.concepts.length > 0) {
  //     // sort concepts based on the weight
  //     let sortedConcepts = this.croForm.concepts.sort((a, b) => b.weight - a.weight);
  //     this.croForm.concepts = sortedConcepts;

  //     for (let i = 0; i < this.croForm.concepts.length; i++) {
  //       let node = this.croForm.concepts[i];
  //       if (i < 5) {
  //         // node["status"] = true;
  //       } else if (i >= 5) {
  //         node["status"] = false;
  //       }
  //     }
  //   }
  // }

  displayAddMoreConcept() {
    this.isAddMoreConceptDisplayed = this.isAddMoreConceptDisplayed === true ? false : true;
  }

  displaySeeMore() {
    this.seeMore = this.seeMore === true ? false : true;
    if (this.croForm.concepts.length > 5) {
      for (let i = 0; i < this.croForm.concepts.length; i++) {
        if (this.seeMore === false) {
          if (i >= 5) {
            let concept_body_ = document.getElementById("concept_body_" +  i)
            if (concept_body_) {
              concept_body_.style.display = "none";
            }
          }
        } else {
          if (i >= 5) {
            let concept_body_ = document.getElementById("concept_body_" +  i)
            if (concept_body_) {
              concept_body_.style.display = "flex";
            }

          }
        }
      }
    }
  }

  deactivateSelection() {
    let conceptsWithStatusTrue = this.croForm.concepts.filter(x => x.status === true)
    // console.warn("conceptsWithStatusTrue ->", conceptsWithStatusTrue)

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
        value["status"] = true
        this.croForm.concepts.push(value);
      } else {
        for(let concept of this.croForm.concepts) {
          if (value.cid === concept.cid) {
            concept.status = !value.status;
            break
          }
        }
      }
    }
    
    this.updateNumberConceptsToBeChecked();
  }

  removeSelectManuallyOnChange(index: number, cid: string) {
    if (index > -1) {
      this.croForm.concepts.splice(index, 1);

      for (let node of this.CROconceptsManually) {
        if (cid === node.cid) {
          node.status = false;
          break;
        }
      }
    }

    // let new_concepts = [];
    // for (let x of this.croForm.concepts) {
    //   if (x.cid !== cro.cid) {
    //     new_concepts.push(x);
    //   } else {
    //     for (let y of this.CROconceptsManually) {
    //       if (y.cid === x.cid) {
    //         y.status = false;
    //         break;
    //       }
    //     }
    //   }
    // }
    // this.croForm.concepts = new_concepts;
    this.updateNumberConceptsToBeChecked();
  }

  getOnlyStatusChecked() {
    let concepts = [];
    for(let concept of this.croForm.concepts) {
      if (concept.status === true) {
        concepts.push(concept);
      }
    }
    this.croForm.concepts = concepts;

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
    }
  }
}