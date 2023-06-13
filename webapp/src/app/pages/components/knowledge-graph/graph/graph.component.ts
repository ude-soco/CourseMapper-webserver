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
  @Input() showMaterialKg: boolean;
  @Input() showCourseKg: boolean;

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
  showConceptAbstract = false;

  newConceptsSubscription: Subscription;
  didNotUnderstandConceptsSubscription: Subscription;
  understoodConceptsSubscription: Subscription;
  truncatedAbstract: string;

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
  ngOnInit(): void {}

  ngOnChanges() {}

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
      let sidebarChild = document.getElementById('abstractSidebarBlock')
        .childNodes[0] as HTMLElement;
      let spanAbstract = document.getElementById('abstractSpan');
      spanAbstract.style.webkitLineClamp = null;
      let sBarAbstract = sidebarChild.childNodes[1].childNodes[0]
        .childNodes[0] as HTMLElement;
      console.log(sBarAbstract.clientHeight);
      let sBarHeight = sidebarChild.clientHeight - sBarAbstract.clientHeight;
      let sBarWidth = sidebarChild.clientWidth;
      //font size is 20 by default
      let fontSize = 20;
      var maxChars =
        Math.floor(sBarWidth / fontSize) * Math.floor(sBarHeight / fontSize) -
        95; //get max number of abstract chars in which no scrolling needed [(container area/ font size)-header area - link size]
      this.truncatedAbstract = this.node_abstract.substring(0, maxChars); // limit max size of chars at abstract
      this.truncatedAbstract = this.truncatedAbstract.substring(
        0,
        this.truncatedAbstract.lastIndexOf(' ')
      ); // subtract last word to prevent showing words with subtracted chars
    }
  }

  nodeChange(event: any) {
    if (event != undefined) {
      this.node_id = event.id;
      this.node_cid = event.cid;
      this.node_name = event.name;
      this.node_type = event.type;
      this.node_abstract = event.abstract;
      this.node_wikipedia = event.wikipedia;
      this.showConceptAbstract = true;
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
          abstractContainer.style.height = 0.9 * this.cyHeight + 'px';
          if (this.materialKnowledgeGraph) {
            let spanAbstract = document.getElementById('abstractSpan');
            if (spanAbstract) {// If selected node is category ==> no abstract span
              spanAbstract.style.webkitLineClamp = null;
            }
            let sBarAbstract = sidebarChild.childNodes[1].childNodes[0]
              .childNodes[0] as HTMLElement;
            console.log(sBarAbstract.clientHeight);
            let sBarHeight =
              sidebarChild.clientHeight - sBarAbstract.clientHeight;
            let sBarWidth = sidebarChild.clientWidth;
            //font size is 20 by default
            let fontSize = 20;
            var maxChars =
              Math.floor(sBarWidth / fontSize) *
                Math.floor(sBarHeight / fontSize) -
              95; //get max number of abstract chars in which no scrolling needed [(container area/ font size)-header area - link size]
            this.truncatedAbstract = this.node_abstract.substring(0, maxChars); // limit max size of chars at abstract
            this.truncatedAbstract = this.truncatedAbstract.substring(
              0,
              this.truncatedAbstract.lastIndexOf(' ')
            ); // subtract last word to prevent showing words with subtracted chars
          }
        } else if (this.slideKnowledgeGraph) {
          let spanAbstract = document.getElementById('abstractSpan');
          spanAbstract.style.webkitLineClamp = '10';
        }
      }, 0);
    } else {
      this.node_id = undefined;
      this.node_cid = undefined;
      this.node_name = undefined;
      this.node_type = undefined;
      this.node_abstract = undefined;
      this.node_wikipedia = undefined;
      this.showConceptAbstract = false;
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
    this.showConceptAbstract = false;
    this.statusServie.abstractStatusChanged();
  }
  markAsUnderstood(nodeId, nodeCid, nodeName) {
    const nodeObj = {
      id: nodeId,
      cid: nodeCid,
      name: nodeName,
    };
    this.slideConceptservice.updateUnderstoodConcepts(nodeObj);
    // this.kgToastService.understoodListupdated()
    this.understoodConceptMsgToast();
  }
  markAsDidNotUnderstand(nodeId, nodeCid, nodeName) {
    const nodeObj = {
      id: nodeId,
      cid: nodeCid,
      name: nodeName,
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
}
