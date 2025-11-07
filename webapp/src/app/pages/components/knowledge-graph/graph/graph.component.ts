import { Neo4jService } from 'src/app/services/neo4j.service';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MessageService } from 'primeng/api';
import { lastValueFrom, Subscription } from 'rxjs';
import { ConceptMapService } from 'src/app/services/concept-map-service.service';
import { ConceptStatusService } from 'src/app/services/concept-status.service';
import { SlideConceptsService } from 'src/app/services/slide-concepts.service';
import { Store } from '@ngrx/store';
import { State, getLoggedInUser } from 'src/app/state/app.reducer';
import { getCurrentMaterial } from '../../materials/state/materials.reducer';
import { environment } from 'src/environments/environment';
import { User } from 'src/app/models/User';
import { Material } from 'src/app/models/Material';

import { getCurrentPdfPage } from '../../annotations/pdf-annotation/state/annotation.reducer';
import { getCurrentCourseId } from 'src/app/pages/courses/state/course.reducer';
@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css'],
})
export class GraphComponent {
  @Input() conceptMapData?: any;
  @Input() conceptMapRecData?: any;
  @Input() selectedFilterValues?: string[];
  @Input() filterUpdated?: boolean;
  @Input() topNConcepts?: any;
  @Input() materialKnowledgeGraph: boolean;
  @Input() slideKnowledgeGraph: boolean;
  @Input() userKnowledgeGraph: boolean;
  @Input() recommenderKnowledgeGraph: boolean;
  @Input() cyHeight: any;
  @Input() cyWidth: any;
  @Input() showMaterialKg: boolean;
  @Input() showCourseKg: boolean;
  @Input() showUserKg: boolean;
  @Input() isDraft: boolean;

  @Output() editConcept: EventEmitter<string> = new EventEmitter();
  @Output() conceptDeleted: EventEmitter<string> = new EventEmitter();
  @Output() conceptDeletedBulk: EventEmitter<string[]> = new EventEmitter();
  @Output() slideNumber = new EventEmitter<number>();
  @Output() sendMaterialId = new EventEmitter<string>();

  node_id: string | undefined;
  node_cid: string | undefined;
  node_name: string | undefined;
  node_type: string | undefined;
  node_abstract: string | undefined;
  node_wikipedia: string | undefined;
  node_mid: string | undefined;

  loggedInUser: User;
  selectedMaterial: Material;

  clamped = false;
  abstractDivBottom;
  linkTop;

  understoodConceptsObj = [];
  didNotUnderstandConceptsObj = [];
  newConceptsObj = [];
  showConceptAbstract = false;

  newConceptsSubscription: Subscription;
  didNotUnderstandConceptsSubscription: Subscription;
  understoodConceptsSubscription: Subscription;
  truncatedAbstract: string;

  currentMaterial: any;
  currentPdfPage: number;
  courseId: string;
  subscriptions: Subscription = new Subscription(); // Manage subscriptions
  constructor(
    // sprivate cdr: ChangeDetectorRef
    private messageService: MessageService, // show toast msgs
    private slideConceptservice: SlideConceptsService, //Change concepts' status on slide_KG [new, understood, did not understand]
    private statusServie: ConceptStatusService, // informs this component when a status has been changed to show a toast msg in case the abstract covers the selected concept
    private conceptMapService: ConceptMapService, // remove concept
    private store: Store<State>,
    private neo4jService: Neo4jService
  ) {
    // this.subscriptions.push(
    //   this.store
    //     .select(getLoggedInUser)
    //     .subscribe((user) => (this.loggedInUser = user))
    // );
    this.newConceptsSubscription = slideConceptservice.newConcepts.subscribe(
      (res) => {
        this.newConceptsObj = res;
      }
    );
    this.didNotUnderstandConceptsSubscription =
      slideConceptservice.didNotUnderstandConcepts.subscribe((res) => {
        this.didNotUnderstandConceptsObj = res;
      });
    this.understoodConceptsSubscription =
      slideConceptservice.understoodConcepts.subscribe((res) => {
        this.understoodConceptsObj = res;
      });

    // Subscribe to get material Data from store
    this.subscriptions.add(
      this.store.select(getCurrentMaterial).subscribe((material) => {
        if (material) {
          this.currentMaterial = material;
        }
      })
    );

    // Subscribe to get the current PDF page from store
    this.subscriptions.add(
      this.store.select(getCurrentPdfPage).subscribe((page) => {
        this.currentPdfPage = page;
      })
    );
    // Subscribe to get the current courseId
    this.store.select(getCurrentCourseId).subscribe((courseId) => {
      this.courseId = courseId;
    });
  }
  ngOnInit(): void {}

  ngAfterContentChecked() {
    //check if text is bigger than container & show wiki_link depending on it
    try {
      this.linkTop = document
        .getElementById('clampedAnchorTagIcon')
        .getBoundingClientRect().top;
      this.abstractDivBottom = document
        .getElementById('abstractSpan')
        .getBoundingClientRect().bottom;
      //if the top coordinate of link icon is bigger than bottom coordinate of abstract_text
      //show link on new line
      if (this.linkTop > this.abstractDivBottom) {
        this.clamped = true;
      } else {
        this.clamped = false;
      }
    } catch {}
  }

  onResize(e) {
    // set number of shown text for abstract on page resize
    let abstractSidebar = document.getElementById('abstractSidebarBlock');
    //if kg at material or course level && abstract sidebar shown
    if (abstractSidebar && this.materialKnowledgeGraph) {
      let abstractContainer = document.getElementById('abstractBlockContainer');
      abstractContainer.style.height =
        Number(this.cyHeight - 75).toString() + 'px';

      let sidebarChild = document.getElementById('abstractSidebarBlock')
        .childNodes[0] as HTMLElement;
      let spanAbstract = document.getElementById('abstractSpan');
      spanAbstract.style.webkitLineClamp = null;
      let sBarAbstract = sidebarChild.childNodes[1].childNodes[0]
        .childNodes[0] as HTMLElement;
      let sBarHeight = sidebarChild.offsetHeight - sBarAbstract.offsetHeight;
      let sBarWidth = sidebarChild.clientWidth;
      //font size is 20 by default
      let fontSize = 20;
      var maxChars =
        Math.floor(sBarWidth / fontSize) * Math.floor(sBarHeight / fontSize) -
        95; //get max number of abstract chars in which no scrolling needed [(container area/ font size)-header area - link size]
      this.truncatedAbstract = this.node_abstract.substring(0, maxChars); // limit max size of chars at abstract
      // this.truncatedAbstract = this.truncatedAbstract.substring(
      //   0,
      //   this.truncatedAbstract.lastIndexOf(' ')
      // ); // subtract last word to prevent showing words with subtracted chars
    }
  }

  nodeChange(event: any) {
    console.log('Node change event received:', event);
    if (event != undefined) {
      this.node_id = event.id;
      this.node_cid = event.cid;
      this.node_name = event.name;
      this.node_type = event.type;
      this.node_abstract = event.abstract;
      this.node_mid = event.mid;
      this.node_wikipedia = event.wikipedia;
      this.showConceptAbstract = true;
      console.log('Setting node properties:', {
        id: this.node_id,
        name: this.node_name,
        type: this.node_type,
        mid: this.node_mid,
      });
      setTimeout(() => {
        let abstractContainer = document.getElementById(
          'abstractBlockContainer'
        );
        let abstractSidebar = document.getElementById('abstractSidebarBlock');
        if (abstractSidebar) {
          abstractSidebar.style.width = 0.4 * this.cyWidth + 'px';
          let sidebarChild = document.getElementById('abstractSidebarBlock')
            .childNodes[0] as HTMLElement;
          sidebarChild.style.height = 100 + '%';

          //get sidebar header
          let sidebarHeader = sidebarChild.childNodes[0] as HTMLElement;
          //set icon position to right
          sidebarHeader.style.position = 'absolute';
          sidebarHeader.style.padding = '0';
          sidebarHeader.style.marginLeft =
            (
              Number(sidebarChild.offsetWidth) - sidebarHeader.offsetWidth
            ).toString() + 'px';

          // set abstractPanel length to be equal to shown kg length
          abstractContainer.style.height =
            Number(this.cyHeight - 75).toString() + 'px';

          // set text length for abstract at material-view and course-view KGs
          if (this.materialKnowledgeGraph) {
            let spanAbstract = document.getElementById('abstractSpan');
            if (spanAbstract) {
              // If selected node is category ==> no abstract span
              spanAbstract.style.webkitLineClamp = null;
            }
            // get abstract's title height
            let sBarAbstract = sidebarChild.childNodes[1].childNodes[0]
              .childNodes[0] as HTMLElement;

            // set abstract text container's height to be whole height except the title's height
            let sBarHeight =
              sidebarChild.offsetHeight - sBarAbstract.offsetHeight;
            let sBarWidth = sidebarChild.clientWidth;
            //font size is 20 by default
            let fontSize = 20;

            // max number of characters to be shown in the abstractContainer, depends on the font size and abstract area (height * width)
            // considering the length of the shown wiki link that is 95
            var maxChars =
              Math.floor(sBarWidth / fontSize) *
                Math.floor(sBarHeight / fontSize) -
              95; //get max number of abstract chars in which no scrolling needed [(container area/ font size)-header area - link size]
            this.truncatedAbstract = this.node_abstract.substring(0, maxChars); // limit max size of chars at abstract

            // // in case removing last word from the text is needed
            // this.truncatedAbstract = this.truncatedAbstract.substring(
            //   0,
            //   this.truncatedAbstract.lastIndexOf(' ')
            // ); // subtract last word to prevent showing words with subtracted chars
          }
        } else if (this.slideKnowledgeGraph) {
          // if abstract is shown in slide-kg, show only 10 lines
          let spanAbstract = document.getElementById('abstractSpan');
          spanAbstract.style.webkitLineClamp = '10';
        }
      }, 0);
    } else {
      this.node_id = undefined;
      this.node_cid = undefined;
      this.node_name = undefined;
      this.node_type = undefined;
      this.node_mid = undefined;
      this.node_abstract = undefined;
      this.node_wikipedia = undefined;
      this.showConceptAbstract = false;
    }
    // this.cdr.detectChanges();
  }

  goToWikipediaPage(wikipedia: string) {
    const data = {
      node_id: this.node_id,
      node_cid: this.node_cid,
      node_name: this.node_name,
      node_type: this.node_type,
      node_abstract: this.node_abstract,
      node_wikipedia: wikipedia,
      courseId: this.courseId,
    };
    if (this.showCourseKg) {
      this.conceptMapService.logViewFullArticleCKG(data).subscribe(); // This is responsible for logging the activity from Course-kg.
    } else if (this.showMaterialKg) {
      const payload = {
        ...data,
        materialId: this.currentMaterial._id,
      };
      this.conceptMapService.logViewFullArticleMKG(payload).subscribe(); // This is responsible for logging the activity from material-kg.
    } else if (this.slideKnowledgeGraph) {
      const payload = {
        ...data,
        materialId: this.currentMaterial._id,
        currentPage: this.currentPdfPage,
      };
      this.slideConceptservice
        .logViewFullArticleMainConcept(payload)
        .subscribe(); // This is responsible for logging the activity from slide-kg & main concepts part.
    }
    if (wikipedia != '') {
      window.open(wikipedia);
    }
  }
  closeAbstractPanel() {
    this.node_name = undefined;
    this.node_type = undefined;
    this.node_abstract = undefined;
    this.node_wikipedia = undefined;
    this.showConceptAbstract = false;
    this.statusServie.abstractStatusChanged();
  }
  markAsUnderstood(nodeId, nodeCid, nodeName, nodeType) {
    const nodeObj = {
      id: nodeId,
      cid: nodeCid,
      name: nodeName,
      type: nodeType,
    };
    this.slideConceptservice.updateUnderstoodConcepts(nodeObj);
    // this.kgToastService.understoodListupdated()
    this.understoodConceptMsgToast();
  }
  markAsDidNotUnderstand(nodeId, nodeCid, nodeName, nodeType) {
    const nodeObj = {
      id: nodeId,
      cid: nodeCid,
      name: nodeName,
      type: nodeType,
    };
    this.slideConceptservice.updateDidNotUnderstandConcepts(nodeObj);
    this.statusServie.statusChanged();
    // this.kgToastService.notUnderstoodListupdated()
    this.notUnderstoodConceptMsgToast();
  }

  understoodConceptMsgToast() {
    this.messageService.add({
      key: 'statusUpdated',
      severity: 'success',
      summary: 'Understood List Updated',
      detail: 'Added to understood concepts list!',
    });
  }
  notUnderstoodConceptMsgToast() {
    this.messageService.add({
      key: 'statusUpdated',
      severity: 'success',
      summary: 'Not Understood List Updated',
      detail: 'Added to not understood concepts list!',
    });
  }

  editConcept_() {
    this.editConcept.emit(this.node_cid);
    this.closeAbstractPanel();
  }

  deleteConcept() {
    this.conceptDeleted.emit(this.node_cid);
    this.closeAbstractPanel();
  }

  async slideRedirect() {
    try {
      console.log(this.node_mid, this.node_cid);
      const record = await this.neo4jService.getConceptSlide(
        this.node_mid,
        this.node_cid
      );
      this.sendMaterialId.emit(this.node_mid);
      if (record) {
        this.closeAbstractPanel();
        console.log(record);
        this.slideNumber.emit(record);
      } else {
        console.log('Error getting slide number');
      }
    } catch (error) {
      console.log('Error finding slide', error);
    }
  }
}
