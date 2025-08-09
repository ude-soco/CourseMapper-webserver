import {
  Component,
  ElementRef,
  Input,
  OnInit,
  Output,
  EventEmitter,
  Renderer2,
} from '@angular/core';

import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import cola from 'cytoscape-cola';
import coseBilkent from 'cytoscape-cose-bilkent';
import fcose from 'cytoscape-fcose';
import spread from 'cytoscape-spread';
import avsdf from 'cytoscape-avsdf';
import cxtmenu from 'cytoscape-cxtmenu';
import { data, event } from 'jquery';
import { ConceptMapComponent } from '../concept-map/concept-map.component';
import popper from 'cytoscape-popper';

import { Subscription } from 'rxjs';
import { NodeClickService } from 'src/app/services/node-click.service';
import { SlideConceptsService } from 'src/app/services/slide-concepts.service';
import { GraphRenderedService } from 'src/app/services/graph-rendered.service';
import { ConceptStatusService } from 'src/app/services/concept-status.service';
import * as $ from 'jquery';
import { getCurrentMaterial } from '../../materials/state/materials.reducer';
import { getCurrentPdfPage } from '../../annotations/pdf-annotation/state/annotation.reducer';
import { State } from 'src/app/state/app.reducer';
import { Store } from '@ngrx/store';
cytoscape.use(cxtmenu);
cytoscape.use(dagre);
cytoscape.use(spread);
cytoscape.use(cola);
cytoscape.use(avsdf);
cytoscape.use(coseBilkent);
cytoscape.use(fcose);
cytoscape.use(popper);

@Component({
  selector: 'app-cytoscape-recommended',
  templateUrl: './cytoscape-recommended.component.html',
  styleUrls: ['./cytoscape-recommended.component.css'],
})
export class CytoscapeRecommendedComponent {
  @Input() elements: any;
  @Input() selectedFilterValues: any;
  @Input() topNConcepts: any;
  @Input() filterUpdated: any;
  @Input() style: any;
  @Input() layout: any;
  @Input() zoom: any;
  @Input() cyHeight: any;

  @Output() selectedNodeEvent: EventEmitter<object> = new EventEmitter();

  didNotUnderstandObj = []; //concepts that user marked as did not understand
  understoodObj = []; //concepts that user marked as understood
  newConceptsObj = []; //concepts that haven't been asigned to understood or did not understand
  allConceptsObj = []; //all concepts of the current slide

  public cy: any;

  public selectedTriggered: boolean = false;

  public _elements: any;

  currentMaterial: any;
  currentPdfPage: number;
  subscriptions: Subscription = new Subscription(); // Manage subscriptions

  newConceptsSubscription: Subscription; // on new concepts list updated
  didNotUnderstandConceptsSubscription: Subscription; // on did not understand concepts list updated
  understoodConceptsSubscription: Subscription; // on understood concepts list updated
  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    private ConceptMapComponent: ConceptMapComponent,
    private nodeClickservice: NodeClickService,
    private slideConceptservice: SlideConceptsService,
    private graphRenderedService: GraphRenderedService,
    private statusService: ConceptStatusService,
    private store: Store<State>
  ) {
    this.layout = {
      name: 'spread',
      minDist: 70,
      padding: 50,
    };
    this.zoom = this.zoom || {
      min: 0.1,
      max: 1.5,
    };
    this.newConceptsSubscription = slideConceptservice.newConcepts.subscribe(
      (res) => {
        this.newConceptsObj = res;
        this.elements.nodes.forEach((node) => {
          this.newConceptsObj.forEach((obj) => {
            // if (node.data.cid.toString() === obj.cid.toString()) {
            if (node.data.id.toString() === obj.cid.toString()) {
              node.data.status = 'unread';
            }
          });
        });
        this.cy.style(this.showAllStyle);
      }
    );
    this.didNotUnderstandConceptsSubscription =
      slideConceptservice.didNotUnderstandConcepts.subscribe((res) => {
        this.didNotUnderstandObj = res;
        this.elements.nodes.forEach((node) => {
          this.didNotUnderstandObj.forEach((obj) => {
            // if (node.data.cid.toString() === obj.cid.toString()) {
            if (node.data.id.toString() === obj.cid.toString()) {
              node.data.status = 'notUnderstood';
            }
          });
        });
        this.cy.style(this.showAllStyle);
      });
    this.understoodConceptsSubscription =
      slideConceptservice.understoodConcepts.subscribe((res) => {
        this.understoodObj = res;
        this.elements.nodes.forEach((node) => {
          this.understoodObj.forEach((obj) => {
            // if (node.data.cid.toString() === obj.cid.toString()) {
            if (node.data.id.toString() === obj.cid.toString()) {
              node.data.status = 'understood';
            }
          });
        });
        this.cy.style(this.showAllStyle);
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
  }
  public showAllStyle: cytoscape.Stylesheet[] = [
    // the stylesheet for the graph
    {
      selector: 'node',
      style: {
        height: function (elm) {
          if (elm.data().type === 'user') return '100';
          else return elm.data().score * 25 + 25;
        },
        width: function (elm) {
          if (elm.data().type === 'user') return '100';
          else return elm.data().score * 25 + 25;
        },
        'text-valign': 'center',
        'text-halign': 'right',
        'text-wrap': 'wrap',
        'background-fit': 'cover',
        content: 'data(name)',
        // 'text-halign': 'center',
        // 'text-valign': 'center',
        'text-outline-width': 0.2,
        'background-color': function (elm) {
          if (elm.data().status === 'unread') return '#2196F3';
          else if (elm.data().status === 'understood') return '#689F38';
          else if (elm.data().status === 'notUnderstood') return '#D32F2F';
          else return '#2196F3';
        },
        'border-opacity': 0.5,
        color: function (elm) {
          if (elm.data().type === 'user') return '#ffffff';
          else return '#000';
        },
        'font-size': 16,
      },
    },

    {
      selector: ':selected',
      css: {
        // 'border-color': 'gold',
        // 'border-width': 'mapData(weight, 0, 1, 1, 3)',
        // 'border-opacity': 0.5,
      },
    },
    {
      selector: '.hidden',
      css: {
        display: 'none',
      },
    },
  ];

  public default = {
    menuRadius: function (ele) {
      return 100;
    }, // the outer radius (node center to the end of the menu) in pixels. It is added to the rendered size of the node. Can either be a number or function as in the example.
    selector: 'node[?wikipedia]', // if node contains article on wikipedia => not category nor user node
    commands: [
      // an array of commands to list in the menu or a function that returns the array
      {
        content:
          '<span style="font-size:15px;">Not Understood</span> <br><i class="pi pi-times" style="color:#D32F2F;"></i>',
        select: function (ele) {
          this._private.data.notUnderstandTriggered = true;
          this._private.data.understoodTriggered = false;
          this._private.data.unReadTriggered = false;
          // alert($ele.data('name'))
        },
      },
      {
        content:
          '<span style="font-size:15px;">Understood</span> <br><i class="pi pi-check" style="color:#689F38;"></i>',
        select: function (ele) {
          this._private.data.notUnderstandTriggered = false;
          this._private.data.understoodTriggered = true;
          this._private.data.unReadTriggered = false;
        },
      },
      {
        content:
          '<span style="font-size:15px;">New</span> <br><i class="pi pi-circle-off" style="color:#2196F3;"></i>',
        select: function (ele) {
          this._private.data.notUnderstandTriggered = false;
          this._private.data.understoodTriggered = false;
          this._private.data.unReadTriggered = true;
        },
      },
    ], // function( ele ){ return [ /*...*/ ] }, // a function that returns commands or a promise of commands
    fillColor: 'rgba(0, 0, 0, 0.75)', // the background colour of the menu
    activeFillColor: 'rgba(1, 105, 217, 0.75)', // the colour used to indicate the selected command
    activePadding: 20, // additional size in pixels for the active command
    indicatorSize: 24, // the size in pixels of the pointer to the active command, will default to the node size if the node size is smaller than the indicator size,
    separatorWidth: 3, // the empty spacing in pixels between successive commands
    spotlightPadding: 4, // extra spacing in pixels between the element and the spotlight
    adaptativeNodeSpotlightRadius: false, // specify whether the spotlight radius should adapt to the node size
    minSpotlightRadius: 24, // the minimum radius in pixels of the spotlight (ignored for the node if adaptativeNodeSpotlightRadius is enabled but still used for the edge & background)
    maxSpotlightRadius: 38, // the maximum radius in pixels of the spotlight (ignored for the node if adaptativeNodeSpotlightRadius is enabled but still used for the edge & background)
    openMenuEvents: 'cxttapstart', // space-separated cytoscape events that will open the menu; only `cxttapstart` and/or `taphold` work here
    itemColor: 'white', // the colour of text in the command's content
    itemTextShadowColor: 'transparent', // the text shadow colour of the command's content
    zIndex: 9999, // the z-index of the ui div
    atMouse: false, // draw menu at mouse position
    outsideMenuCancel: false, // if set to a number, this will cancel the command if the pointer is released outside of the spotlight, padded by the number given
  };

  ngOnChanges() {
    // console.log(this.elements);
    this.init();
  }

  init() {
    let cy_container = this.renderer.selectRootElement('#cyRecommender');
    if (this.elements !== undefined) {
      this._elements = this.elements;
      setTimeout(() => {
        this.cy = cytoscape({
          container: cy_container,
          layout: this.layout,
          minZoom: this.zoom.min,
          maxZoom: this.zoom.max,
          style: this.showAllStyle,
          elements: this._elements,
          autounselectify: true,
        });
        this.cy.cxtmenu(this.default);
        if (this._elements !== undefined) {
          this.cy.ready(() => {
            this.render();
          });
        }
      }, 2);
      document.getElementById('cyRecommender').style.height =
        this.cyHeight + 'px';
    }
  }
  render() {
    if (this._elements !== undefined) {
      let selectedNode: any = undefined;

      this.cy.on('click', (event: any) => {
        $('html,body').css('cursor', 'default');
        var node = event.target;
        if (node !== this.cy) {
          if (node.isNode()) {
            const elements = document.getElementsByClassName('popper-div');
            while (elements.length > 0) {
              elements[0].parentNode.removeChild(elements[0]);
            }
          }
        }
        var eventTarget = event.target;
        if (eventTarget !== this.cy) {
          if (eventTarget.isNode()) {
            this.nodeClickservice.nodeClicked();
            const selectedId = eventTarget.data('id');
            selectedNode = {
              id: eventTarget.data('id'),
              cid: eventTarget.data('id'),
              name: eventTarget.data('name'),
              type: eventTarget.data('type'), // it shows recommended_concept
              abstract: eventTarget.data('abstract'),
              wikipedia: eventTarget.data('wikipedia'),
              reason: eventTarget.data('Reason'),
              score: eventTarget.data('score'),
              roads: eventTarget.data('roads'),
            };
            this.elements.nodes.map((node) => {
              node.data.selected = 'u';
            });
            this.elements.nodes.some((node) => {
              if (node.data.id.toString() === selectedId.toString()) {
                node.data.selected = 's';
              }
            });
            const payload = {
              materialId: this.currentMaterial._id,
              courseId: this.currentMaterial.courseId,
              currentPage: this.currentPdfPage,
              concept: selectedNode, // Include the selected node
            };
            console.log('payload of recommended concept: ', payload);
            this.slideConceptservice.logViewConcept(payload).subscribe(); // "User viewed a recommended concept under the recommended concepts tab "
          } else {
            this.elements.nodes.map((node) => {
              node.data.selected = 'u';
            });
          }
        }
        this.selectedNodeEvent.emit(selectedNode);
        selectedNode = undefined;
      });
      this.cy.on('mouseout', 'node', (event: any) => {
        $('html,body').css('cursor', 'default');
        var node = event.target;
        if (node !== this.cy) {
          if (node.isNode()) {
            const elements = document.getElementsByClassName('popper-div');
            while (elements.length > 0) {
              elements[0].parentNode.removeChild(elements[0]);
            }
          }
        }
      });
      this.cy.on('mouseover', 'node', (event) => {
        var node = event.target;
        if (node !== this.cy) {
          if (node.isNode() && node.data('wikipedia')) {
            $('html,body').css('cursor', 'pointer');
            let div = document.createElement('div');

            div.classList.add('popper-div');

            div.innerHTML = 'Right click and hold to show options';

            div.style.zIndex = '9999';
            div.style.background = '#a0a0a0';
            div.style.color = '#ffffff';
            div.style.borderRadius = '4xp 4xp 0 0';

            document.body.appendChild(div);
            let popper = node.popper({
              content: function () {
                return div;
              },
            });
            let update = function () {
              popper.update();
            };
            node.on('position', update);
          }
        }
      });
      this.cy.on('cxttapstart', (event: any) => {
        $('html,body').css('cursor', 'default');
        var node = event.target;
        if (node !== this.cy) {
          if (node.isNode()) {
            const elements = document.getElementsByClassName('popper-div');
            while (elements.length > 0) {
              elements[0].parentNode.removeChild(elements[0]);
            }
          }
        }
      });
      this.cy.on('cxttapend', (event: any) => {
        var eventTarget = event.target;
        if (
          eventTarget.data('wikipedia') &&
          eventTarget.data('wikipedia') !== '' &&
          eventTarget._private.data.notUnderstandTriggered
        ) {
          // Node contains wiki article && node selected
          const selectedId = eventTarget.data('id').toString();
          const selectedName = eventTarget.data('name').toString();
          const selectedType = eventTarget.data('type').toString();
          const notUnderstandEle = {
            id: selectedId,
            cid: selectedId,
            name: selectedName,
            type: selectedType,
          };
          this.slideConceptservice.updateDidNotUnderstandConcepts(
            notUnderstandEle
          );
          this.statusService.statusChanged();
          eventTarget._private.data.notUnderstandTriggered = false;
        }
        if (
          eventTarget.data('wikipedia') &&
          eventTarget.data('wikipedia') !== '' &&
          eventTarget._private.data.understoodTriggered
        ) {
          // Node contains non-empty abstract && material recommender selected
          const selectedId = eventTarget.data('id').toString();
          const selectedName = eventTarget.data('name').toString();
          const selectedType = eventTarget.data('type').toString();
          const understoodEle = {
            id: selectedId,
            cid: selectedId,
            name: selectedName,
            type: selectedType,
          };
          this.slideConceptservice.updateUnderstoodConcepts(understoodEle);
          // this.statusService.statusChanged()
          eventTarget._private.data.understoodTriggered = false;
        }
        if (
          eventTarget.data('wikipedia') &&
          eventTarget.data('wikipedia') !== '' &&
          eventTarget._private.data.unReadTriggered
        ) {
          // Node contains non-empty abstract && concept recommender selected
          const selectedId = eventTarget.data('id').toString();
          const selectedName = eventTarget.data('name').toString();
          const selectedType = eventTarget.data('type').toString();
          const newConceptEle = {
            id: selectedId,
            cid: selectedId,
            name: selectedName,
            type: selectedType,
          };
          this.slideConceptservice.updateNewConcepts(newConceptEle);
          eventTarget._private.data.unReadTriggered = false;
        }
      });
    }
  }
}
