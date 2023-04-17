import { Component, Input } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { ConceptStatusService } from 'src/app/services/concept-status.service';
import { SlideConceptsService } from 'src/app/services/slide-concepts.service';

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
  @Input() recommenderKnowledgeGraph: boolean;
  @Input() cyHeight: any;
  @Input() cyWidth: any;

  node_id: string | undefined;
  node_cid: string | undefined;
  node_name: string | undefined;
  node_type: string | undefined;
  node_abstract: string | undefined;
  node_wikipedia: string | undefined;

  clamped = false;
  abstractDivBottom;
  linkTop;

  understoodConceptsObj = [];
  didNotUnderstandConceptsObj = [];
  newConceptsObj = [];
  showConceptAbstract=false

  newConceptsSubscription: Subscription;
  didNotUnderstandConceptsSubscription: Subscription;
  understoodConceptsSubscription: Subscription;

  constructor(
    private messageService: MessageService, // show toast msgs
    private slideConceptservice: SlideConceptsService, //Change concepts' status on slide_KG [new, understood, did not understand]
    private statusServie: ConceptStatusService // informs this component when a status has been changed to show a toast msg in case the abstract covers the selected concept
  ) {
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
  }
  ngOnInit(): void {
  }

  ngOnChanges() {}

  ngAfterContentChecked() {
    try {
      this.linkTop = document
        .getElementById('clampedAnchorTag')
        .getBoundingClientRect().top;
      this.abstractDivBottom = document
        .getElementById('abstractSpan')
        .getBoundingClientRect().bottom;
      if (this.linkTop > this.abstractDivBottom) {
        this.clamped = true;
      } else {
        this.clamped = false;
      }
    } catch {}
  }

  nodeChange(event: any) {
    if (event != undefined) {
      this.node_id = event.id;
      this.node_cid = event.cid;
      this.node_name = event.name;
      this.node_type = event.type;
      this.node_abstract = event.abstract;
      this.node_wikipedia = event.wikipedia;
      this.showConceptAbstract=true
      setTimeout(() => {
        let abstractContainer= document.getElementById('abstractBlockContainer')
        let abstractSidebar= document.getElementById('abstractSidebarBlock')
        if(abstractSidebar){
          abstractSidebar.style.width=0.4*this.cyWidth+'px'
          let sidebarChild = document.getElementById('abstractSidebarBlock').childNodes[0] as HTMLElement
          sidebarChild.style.height=100+'%'
          abstractContainer.style.height=0.9*this.cyHeight+'px'

        }
      }, 0);
    } else {
      this.node_id = undefined;
      this.node_cid = undefined;
      this.node_name = undefined;
      this.node_type = undefined;
      this.node_abstract = undefined;
      this.node_wikipedia = undefined;
      this.showConceptAbstract=false
    }
  }

  goToWikipediaPage(wikipedia: string) {
    if (wikipedia != '') {
      window.open(wikipedia);
    }
  }
  closeAbstractPanel() {
    this.node_name = undefined;
    this.node_type = undefined;
    this.node_abstract = undefined;
    this.node_wikipedia = undefined;
    this.showConceptAbstract=false
    this.statusServie.abstractStatusChanged()
  }
  markAsUnderstood(nodeId, nodeCid, nodeName) {
    const nodeObj = {
      id:nodeId,
      cid:nodeCid,
      name:nodeName,
    }
    this.slideConceptservice.updateUnderstoodConcepts(nodeObj)
    // this.kgToastService.understoodListupdated()
    this.understoodConceptMsgToast()
  }
  markAsDidNotUnderstand(nodeId, nodeCid, nodeName) {
    console.log(nodeId)
    console.log(nodeCid)
    console.log(nodeName)
    const nodeObj = {
      id:nodeId,
      cid:nodeCid,
      name:nodeName,
    }
    console.log(nodeObj)
    this.slideConceptservice.updateDidNotUnderstandConcepts(nodeObj)
    this.statusServie.statusChanged()
    // this.kgToastService.notUnderstoodListupdated()
    this.notUnderstoodConceptMsgToast()
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
}
