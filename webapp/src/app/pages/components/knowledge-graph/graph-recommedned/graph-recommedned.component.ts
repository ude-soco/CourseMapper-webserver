import { Component, OnInit, Input } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { ConceptStatusService } from 'src/app/services/concept-status.service';
import { SlideConceptsService } from 'src/app/services/slide-concepts.service';
import { UserServiceService } from 'src/app/services/user-service.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-graph-recommedned',
  templateUrl: './graph-recommedned.component.html',
  styleUrls: ['./graph-recommedned.component.css'],
})
export class GraphRecommednedComponent {
  node_id: string | undefined;
  node_cid: string | undefined;
  node_name: string | undefined;
  node_type: string | undefined;
  node_abstract: string | undefined;
  node_wikipedia: string | undefined;
  node_score: string | undefined;
  node_roads: string | undefined;
  node_reason: any[] | undefined;

  clamped = false;
  abstractDivBottom;
  linkTop;

  @Input() conceptMapRecData?: any;
  @Input() conceptSequenceMapRecData?: any;
  @Input() selectedFilterValues?: string[];
  @Input() filterUpdated?: boolean;
  @Input() topNConcepts?: any;
  @Input() materialKnowledgeGraph: boolean;
  @Input() slideKnowledgeGraph: boolean;
  @Input() recommenderKnowledgeGraph: boolean;
  @Input() cyHeight: any = 500;

  newConceptsSubscription: Subscription;
  didNotUnderstandConceptsSubscription: Subscription;
  understoodConceptsSubscription: Subscription;

  understoodConceptsObj = [];
  didNotUnderstandConceptsObj = [];
  newConceptsObj = [];

  selectedExplanation: any = null;

  cyHeightRec:any;

  explanations: any[] = [
    { name: 'Visual Explanation', key: 'V' },
    { name: 'Textual Explanation', key: 'T' },
  ];

  unclearConcepts = [];
  reasonsList = [];
  unclearConcepts1 = null;

  showVisual = true;
  showTextual = false;

  constructor(
    private messageService: MessageService,
    private slideConceptservice: SlideConceptsService,
    private statusServie: ConceptStatusService,
    private userService: UserServiceService
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
  ngOnChanges() {}
  ngOnInit(): void {
    this.selectedExplanation = this.explanations[0];
  }

  ngAfterContentChecked() {

    let accordionTabAbstract = document.getElementById('accordionHeader');
    let accordionTabReason = document.getElementById('accordionHeaderReason');
    if(accordionTabAbstract && accordionTabReason){
      let accordionComponentHeader1=accordionTabAbstract.childNodes[0].childNodes[0].childNodes[0] as HTMLElement;
      accordionComponentHeader1.style.color='#212121'
      accordionComponentHeader1.style.backgroundColor='white'
      accordionComponentHeader1.style.borderBottom='solid #E5E7EB 1px'

      let accordionComponentHeader2=accordionTabReason.childNodes[0].childNodes[0].childNodes[0] as HTMLElement;
      accordionComponentHeader2.style.color='#212121'
      accordionComponentHeader2.style.backgroundColor='white'
      accordionComponentHeader2.style.borderBottom='solid #E5E7EB 1px'
    }
    try {
      this.linkTop = document
        .getElementById('clampedAnchorTagIcon')
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
      // this.node_cid = event.cid;
      this.node_cid = event.id; // no node_id received from server. Only cid
      this.node_name = event.name;
      this.node_type = event.type;
      this.node_abstract = event.abstract;
      this.node_wikipedia = event.wikipedia;
      this.node_score = event.score;
      this.node_reason = event.reason;

      if (this.node_reason) {
        try {
          this.unclearConcepts = [];
          this.reasonsList = [];
          this.unclearConcepts1 = null;
          let dnu = this.node_reason[0];
          this.unclearConcepts1 = JSON.stringify(dnu);
          let splitted = this.unclearConcepts1.replace('{"dnu":[', '');
          splitted = splitted.replace(']}', '');
          splitted = splitted.replace(/['"]+/g, '');
          splitted = splitted.replace('"}', '');
          splitted = splitted.split(',');
          for (let i = 0; i < splitted.length; i++) {
            if (i === splitted.length - 1) {
              splitted[i] = splitted[i];
              this.unclearConcepts.push(splitted[i]);
            } else {
              splitted[i] = splitted[i] + ', ';
              this.unclearConcepts.push(splitted[i]);
            }
          }

          for (let i = 1; i < this.node_reason.length; i++) {
            let reason = this.node_reason[i];

            let dnuText = '';
            reason.dnu.forEach((reas, index) => {
              if (index === 0) {
                dnuText = '"' + reas + '",';
              } else {
                dnuText = dnuText + ' "' + reas + '",';
              }
            });
            dnuText = dnuText.replace(/.$/, ' ');

            let text = '';
            if (reason.type === 'Related') {
              // text= reason.name + ' is strongly related to: ' +reason.dnu
              text =
                '"' + reason.name + '"' + ' is strongly related to: ' + dnuText;
            } else if (reason.type === 'Slide') {
              // text= reason.dnu +' & '+this.node_name+ ' appear in the same slide: ' +reason.name
              text =
                dnuText +
                ' & ' +
                '"' +
                this.node_name +
                '"' +
                ' appear in the same slide: "' +
                reason.name +
                '"';
            } else if (reason.type === 'category') {
              // text= reason.dnu + ' and concept ' +this.node_name+ ' have the same category: '+ reason.name
              text =
                dnuText +
                ' and concept ' +
                '"' +
                this.node_name +
                '"' +
                ' have the same category: "' +
                reason.name +
                '"';
            } else if (reason.type === 'related_concept') {
              // text= reason.dnu + ' & '+this.node_name+' have same related concept ' +reason.name
              text =
                dnuText +
                ' & ' +
                '"' +
                this.node_name +
                '"' +
                ' have same related concept: "' +
                reason.name +
                '"';
            }
            this.reasonsList.push(text);
          }
        } catch {}

        setTimeout(() => {
          let accordionHeader = document.getElementById('accordionHeader')
            .childNodes[0].childNodes[0].childNodes[0] as HTMLElement;
          let accordionHeaderReason = document.getElementById(
            'accordionHeaderReason'
          ).childNodes[0].childNodes[0].childNodes[0] as HTMLElement;

          if (accordionHeader) {
            accordionHeader.style.backgroundColor = '#e9ecef';
            accordionHeader.style.color = '#747d84';
          }
          if (accordionHeaderReason) {
            accordionHeaderReason.style.backgroundColor = '#e9ecef';
            accordionHeaderReason.style.color = '#747d84';
          }

          let abstracBlock = document.getElementById(
            'recommenderAbstractBlock'
          ) as HTMLElement;

          if (abstracBlock) {
            abstracBlock.style.maxHeight = Number(this.cyHeight-75).toString() + 'px';
            console.log("cyHeight raph recommended", this.cyHeight)
            console.log(abstracBlock)
            console.log(abstracBlock.style.maxHeight)
            let accordionAbstract = document.getElementById('accordionHeader').childNodes[0].childNodes[0] as HTMLElement;
            this.cyHeightRec =Number(this.cyHeight - 75 - 3 * accordionAbstract.offsetHeight - 65).toString() + 'px';
            console.log("cyHeightRec", this.cyHeightRec)
            }
            // Create a set of all required users
            let requiredUsers = new Set([]);
            this.node_roads = event.roads.forEach((roads: any[]) => {
              roads.forEach((road) => {
                if (road.type === 'user') {
                  requiredUsers.add(road.id);
                }
              });
            });
            // Retrieve users from the server and store usernames in an object
            let users = {};
            let promises = [];
            requiredUsers.forEach((userId) => {
              promises.push(
                lastValueFrom(this.userService.GetUserName(userId)).then((user) => {
                  users[userId] = user.firstname + ' ' + user.lastname;
                })
              );
            });
            // Assign usernames to road nodes
            Promise.all(promises).then(() => {
              this.node_roads = event.roads.map((roads: any[]) => {
                return roads.map((road) => {
                  if (road.type === 'user') {
                    return {
                      ...road,
                      name: users[road.id],
                    };
                  } else {
                    return road;
                  }
                });
              });
            });
        }, 1);
      }
    } else {
      this.node_id = undefined;
      this.node_cid = undefined;
      this.node_name = undefined;
      this.node_type = undefined;
      this.node_abstract = undefined;
      this.node_wikipedia = undefined;
      this.node_score = undefined;
      this.node_reason = undefined;
      this.node_roads = undefined;
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
  }
  markAsUnderstood(nodeId, nodeCid, nodeName) {
    const nodeObj = {
      id: nodeId,
      cid: nodeCid,
      name: nodeName,
    };
    this.slideConceptservice.updateUnderstoodConcepts(nodeObj);
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
    this.notUnderstoodConceptMsgToast();
  }
  chosenRB(key) {
    console.log(key);
    if (key === 'V') {
      this.showVisual = true;
      this.showTextual = false;
    } else if (key === 'T') {
      this.showVisual = false;
      this.showTextual = true;

      let accordionAbstract = document.getElementById('accordionHeader').childNodes[0].childNodes[0] as HTMLElement;
      setTimeout(() => {
        document.getElementById('abstract_reason_Block_Text').style.height= Number(this.cyHeight - 75 - 3 * accordionAbstract.offsetHeight - 20).toString() +'px';
      }, 2);
    }
  }
  understoodConceptMsgToast() {
    this.messageService.add({
      key: 'statusUpdatedRecommended',
      severity: 'success',
      summary: 'Understood List Updated',
      detail: 'Added to understood concepts list!',
    });
  }
  notUnderstoodConceptMsgToast() {
    this.messageService.add({
      key: 'statusUpdatedRecommended',
      severity: 'success',
      summary: 'Not Understood List Updated',
      detail: 'Added to not understood concepts list!',
    });
  }
}
