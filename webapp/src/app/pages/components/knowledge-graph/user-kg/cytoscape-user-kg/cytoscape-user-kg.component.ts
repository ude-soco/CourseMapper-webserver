import { StyleClassModule } from 'primeng/styleclass';
import {
  Component,
  EventEmitter,
  Input,
  Output,
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
import popper from 'cytoscape-popper';
import { ConceptStatusService } from 'src/app/services/concept-status.service';
import { Subscription } from 'rxjs';
import { SlideConceptsService } from 'src/app/services/slide-concepts.service';
import * as $ from 'jquery';
import { CallRecommendationsService } from 'src/app/services/call-recommendations.service';
import { MaterialsRecommenderService } from 'src/app/services/materials-recommender.service';
import { Neo4jService } from 'src/app/services/neo4j.service';
import { MessageService } from 'primeng/api';

cytoscape.use(cxtmenu);
cytoscape.use(dagre);
cytoscape.use(spread);
cytoscape.use(cola);
cytoscape.use(avsdf);
cytoscape.use(coseBilkent);
cytoscape.use(fcose);
cytoscape.use(popper);
// cytoscape.use(grid);

@Component({
  selector: 'app-cytoscape-user-kg',
  templateUrl: './cytoscape-user-kg.component.html',
  styleUrls: ['./cytoscape-user-kg.component.css'],
})
export class CytoscapeUserKgComponent {
  @Input() elements: any;
  @Input() selectedFilterValues: any;
  @Input() topNConcepts: any;
  @Input() filterUpdated: any;
  @Input() style: any;
  @Input() layout: any;
  @Input() zoom: any;
  @Input() cyHeight: any;
  @Input() showUserKg: boolean;
  @Input() isDraft: boolean;
  @Input() showEngagementKg: boolean;
  @Input() showDNUEngagementKg: boolean;
  @Input() showDNU: boolean;
  @Input() showU: boolean;

  @Output() selectedNodeEvent: EventEmitter<object> = new EventEmitter();
  @Output() conceptDeleted?: EventEmitter<string> = new EventEmitter();
  @Output() editConcept?: EventEmitter<string> = new EventEmitter();
  @Output() conceptDeletedBulk?: EventEmitter<string[]> = new EventEmitter();

  public cy: any;

  public selectedTriggered: boolean = false;

  public _elements: any;

  annotationsNodes: any[];
  propertiesNodes: any[];
  relatedNodes: any[];
  categoryNodes: any[];
  userEdges: any[];
  nodeSelected: boolean;
  didNotUnderstandObj = []; //concepts that user marked as did not understand
  understoodObj = []; //concepts that user marked as understood
  newConceptsObj = []; //concepts that haven't been asigned to understood or did not understand
  allConceptsObj = []; //all concepts of the current slide
  reqDataForm: any;

  abstractStatusSubscription: Subscription;
  newConceptsSubscription: Subscription; // on new concepts list updated
  didNotUnderstandConceptsSubscription: Subscription; // on did not understand concepts list updated
  understoodConceptsSubscription: Subscription; // on understood concepts list updated
  allNotUnderstoodConceptsSubscription: Subscription; // on understood concepts list updated
  allNotUnderstoodConcepts: any[];
  disableRecommendationsButton = true;
  disabledTabsSubscription: Subscription; // on understood concepts list updated
  recommendationsOrderedSubscription: Subscription; // on understood concepts list updated
  loadingRecommendaion = false;
  recDataSubscription: Subscription;

  constructor(
    private messageService: MessageService,
    private renderer: Renderer2,
    private abstractStatus: ConceptStatusService,
    private slideConceptservice: SlideConceptsService,
    private statusService: ConceptStatusService,
    private callRecommendationsService: CallRecommendationsService,
    private materialsRecommenderService: MaterialsRecommenderService,
    private neo4jService: Neo4jService
  ) {
    this.abstractStatusSubscription = abstractStatus
      .abstractStatusObserver()
      .subscribe(() => {
        console.log('closed');
        let cyElement = document.getElementById('cy');
        if (cyElement) {
          cyElement.style.width = 100 + '%';
        }
      });

    this.layout = {
      name: 'fcose',
      // Better for larger graphs
      quality: 'proof',
      randomize: false,
      // Increase spacing between nodes
      nodeRepulsion: 15000,
      idealEdgeLength: 200,
      edgeElasticity: 0.6,
      // Tiered positioning
      nodeDimensionsIncludeLabels: true,
      // Better component handling
      packComponents: true,
      // Improved algorithm parameters for larger graphs
      numIter: 4000,
      initialEnergyOnIncremental: 0.3,
      // Improved positioning
      gravity: 0.25,
      gravityRangeCompound: 1.5,
      // Hierarchical structure
      tile: true,
      tilingPaddingVertical: 30,
      tilingPaddingHorizontal: 30,
      animationDuration: 50,
    };
    this.zoom = this.zoom || {
      min: 0.9,
      max: 2.0,
    };

    this.newConceptsSubscription = slideConceptservice.newConcepts.subscribe(
      (res) => {
        this.newConceptsObj = res;
        let newConceptsCid = [];
        this.elements.nodes.forEach((node) => {
          this.newConceptsObj.forEach((obj) => {
            newConceptsCid.push(obj.cid);
            if (node.data.cid === obj.cid) {
              node.data.status = 'unread';
            }
          });
        });
        this.cy.style(this.showAllStyle);
        //remove new concepts cids from allNotUnderstood
        this.allNotUnderstoodConcepts = this.allNotUnderstoodConcepts.filter(
          (x) => !newConceptsCid.includes(x)
        );
        // enable|disable "show recommendations" button
        if (this.allNotUnderstoodConcepts.length) {
          this.disableRecommendationsButton = false;
        } else {
          this.disableRecommendationsButton = true;
        }
      }
    );
    this.didNotUnderstandConceptsSubscription =
      slideConceptservice.didNotUnderstandConcepts.subscribe((res) => {
        this.didNotUnderstandObj = res;
        let notUnderstoodCid = [];
        console.log(this.elements.nodes);
        this.elements.nodes.forEach((node) => {
          this.didNotUnderstandObj.forEach((obj) => {
            notUnderstoodCid.push(obj.cid);
            if (node.data.cid === obj.cid) {
              node.data.status = 'notUnderstood';
            }
          });
        });
        this.cy.style(this.showAllStyle);
        //substract previous notUnderstood cids from current notUnderstood
        notUnderstoodCid = notUnderstoodCid.filter(
          (x) => !this.allNotUnderstoodConcepts.includes(x)
        );
        // concat both arrays
        this.allNotUnderstoodConcepts =
          this.allNotUnderstoodConcepts.concat(notUnderstoodCid);
        // enable|disable "show recommendations" button
        if (this.allNotUnderstoodConcepts.length) {
          this.disableRecommendationsButton = false;
        } else {
          this.disableRecommendationsButton = true;
        }
      });
    this.understoodConceptsSubscription =
      slideConceptservice.understoodConcepts.subscribe((res) => {
        this.understoodObj = res;
        let understoodCid = [];
        this.elements.nodes.forEach((node) => {
          this.understoodObj.forEach((obj) => {
            understoodCid.push(obj.cid);
            if (node.data.cid === obj.cid) {
              node.data.status = 'understood';
            }
          });
        });
        this.cy.style(this.showAllStyle);
        //remove understood concepts cids from allNotUnderstood
        this.allNotUnderstoodConcepts = this.allNotUnderstoodConcepts.filter(
          (x) => !understoodCid.includes(x)
        );
        // enable|disable "show recommendations" button
        if (this.allNotUnderstoodConcepts.length) {
          this.disableRecommendationsButton = false;
        } else {
          this.disableRecommendationsButton = true;
        }
      });
  }

  public irrelevantConcepts: string[] = []; // Define this property in your class
  showBulkDeletion: boolean = true; // Define this property in your class

  public showAllStyle: cytoscape.Stylesheet[] = [
    {
      selector: 'node',
      style: {
        height: function () {
          return 50;
        },
        width: function () {
          return 50;
        },
        'border-width': '2px',
        'border-opacity': 0.5,
        'text-wrap': 'wrap',
        'background-fit': 'cover',
        content: 'data(name)',
        'text-halign': 'center',
        'text-valign': 'center',
        'text-outline-width': 0.2,
        'background-color': (elm) => {
          if (elm.data().type === 'related_concept') return '#ce6f34';
          else if (elm.data().type === 'category') return '#FBC02D';
          else if (elm.data().type === 'Course') return '#d49125';
          else if (elm.data().type === 'topic') return '#607D8B';
          else if (elm.data().type === 'channel') return '#9C27B0';
          else if (elm.data().type === 'material') return '#2196F3';
          else if (elm.data().type === 'user') return '#A225D4'; // user node
          const targetEdge = elm
            .connectedEdges()
            .filter((edge) => edge.data().target === elm.id());
          if (targetEdge.length > 0 && targetEdge[0].data().type === 'dnu') {
            return '#CB2D2D';
          } else if (
            targetEdge.length > 0 &&
            targetEdge[0].data().type === 'u'
          ) {
            return '#23A138';
          } else {
            return '#2196F3';
          }
        },
        color: '#000',
        'font-size': 16,
      },
    },
    {
      selector: 'edge',
      style: {
        content: (elm) => {
          if (elm.data().type !== 'ENGAGED_IN') return elm.data().type;
          else
            return elm.data().type + ' ' + '(LEVEL= ' + elm.data().level + ')';
        },
        'curve-style': 'bezier',
        width: '2px',
        'target-arrow-shape': 'triangle',
        'source-arrow-color': '#b5b5b3',
        'target-arrow-color': '#b5b5b3',
        'text-rotation': 'autorotate',
        'line-color': '#b5b5b3',
        color: '#323232',
        'text-outline-color': '#fff',
        'text-outline-width': 1,
        'font-size': 16,
      },
    },
    {
      selector: ':selected',
      style: {
        'border-width': 1,
        'border-color': 'black',
      },
    },
    {
      selector: 'edge.questionable',
      style: {
        'line-style': 'dotted',
        'target-arrow-shape': 'diamond',
      },
    },
    {
      selector: '.faded',
      style: {
        opacity: 0.05,
        'text-opacity': 0,
      },
    },
    {
      selector: '.connected-edges',
      style: {
        'source-arrow-color': '#000',
        'target-arrow-color': '#000',
        'line-color': '#000',
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
          '<span style="font-size:15px;">Not Understood</span> <br> <i class="pi pi-times" style="color:#D32F2F;"></i>',
        select: function (ele) {
          this._private.data.notUnderstandTriggered = true;
          this._private.data.understoodTriggered = false;
          this._private.data.unReadTriggered = false;
          // alert($ele.data('name'))
          // console.log(this);

          const connectedEdges = ele.connectedEdges();
          connectedEdges.forEach((edge) => {
            if (edge.target() === ele.id()) {
              console.log('Changing selected node to DNU');
              edge.data('type', 'dnu');
            }
          });
        },
      },
      {
        content:
          '<span style="font-size:15px;">Understood</span> <br> <i class="pi pi-check" style="color:#689F38;"></i>',
        select: function (ele) {
          // console.log(ele.position());
          this._private.data.notUnderstandTriggered = false;
          this._private.data.understoodTriggered = true;
          this._private.data.unReadTriggered = false;
          // console.log(this);
          const connectedEdges = ele.connectedEdges();
          connectedEdges.forEach((edge) => {
            if (edge.target() === ele.id()) {
              console.log('Changing selected node to U');
              edge.data('type', 'u');
            }
          });
        },
      },
      {
        content:
          '<span style="font-size:15px;">New</span> <br> <i class="pi pi-circle-off" style="color:#2196F3;"></i>',
        // content: 'Unread',
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

  ngOnInit() {
    this.allNotUnderstoodConcepts =
      this.slideConceptservice.didNotUnderstandAllConcepts;
    if (this.allNotUnderstoodConcepts.length) {
      this.disableRecommendationsButton = false;
    } else {
      this.disableRecommendationsButton = true;
    }
  }

  ngOnChanges() {
    if (!this.showUserKg) {
      this.selectedFilterValues = ['main_concept'];
    }
    this.init();
    this.render();
  }

  onResize(e) {
    let abstractContainer = document.getElementById('abstractBlockContainer');
    if (abstractContainer) {
      document.getElementById('cy').style.width = 100 + '%';
      let currentWidth = document.getElementById('cy').clientWidth;
      document.getElementById('cy').style.width =
        currentWidth - abstractContainer.clientWidth - 20 + 'px';
      this.nodeSelected = true;
    } else {
      document.getElementById('cy').style.width = 100 + '%';
    }
  }

  updateEdgeType = async function (nodeId: string, type: string) {
    const selectedEdge = this.elements.edges.filter(
      (edge) => edge.data.target === nodeId
    );
    selectedEdge.forEach((edge) => {
      edge.data.type = type;
    });
    console.log(selectedEdge[0]);
    await this.neo4jService.updateConceptUDNU(
      selectedEdge[0].data.source,
      selectedEdge[0].data.target,
      type
    );

    this._elements = {
      nodes: this._elements.nodes,
      edges: this.userEdges,
      button: this.elements.button,
    };
  };

  resetGraphView(exceptNode = null) {
    // Reset all node styling
    this.cy.nodes().style({
      'border-width': '2px',
      'border-color': '#000',
      'border-opacity': 0.5,
    });

    // Hide all edges
    this.cy.edges().style('display', 'none');

    if (this.showDNUEngagementKg) {
      this.cy
        .edges()
        .filter((edge) => edge.data('type') !== 'HAS_CONCEPT')
        .style('display', 'element');
    }

    this.cy
      .nodes()
      .filter((n) => n.data('type') === 'user')
      .style('display', 'element');

    if (this.showEngagementKg || this.showDNUEngagementKg) {
      this.cy
        .nodes()
        .filter((n) => n.data('type') === 'Course')
        .style('display', 'element');
    }

    // Make all main_concept nodes visible in user KG view
    if (this.showUserKg) {
      this.cy
        .nodes()
        .filter((n) => n.data('type') === 'main_concept')
        .style('display', 'element');
    }
  }

  deleteRelationship = async function (rid: string) {
    console.log(this.userEdges);
    const selectedEdge = this.elements.edges.filter(
      (edge) => edge.data.id === rid
    );
    await this.neo4jService.deleteRelationship(rid);

    this.userEdges = this.userEdges.filter((edge) => edge.data.id !== rid);
    this.elements.edges = this.elements.edges.filter(
      (edge) => edge.data.id !== rid
    );

    console.log(selectedEdge[0].data.target);
    const conceptId = selectedEdge[0].data.target;
    await this.neo4jService.renewConcept(conceptId);
    /*this._elements.nodes = this.elements.nodes.filter(
      (node) => !node.data.isDeleted
    );*/
    console.log(this._elements.nodes);
    console.log(this.userEdges);
    /*this._elements = {
      nodes: this._elements.nodes,
      edges: this.userEdges,
      button: this.elements.button,
    };*/
    const deletedEdge = this.cy.$(`edge[id = "${rid}"]`);
    if (deletedEdge.length > 0) {
      this.cy.remove(deletedEdge);
      console.log('Edge removed from Cytoscape');
    } else {
      console.log('Edge not found in Cytoscape');
    }

    console.log('After deletion - edges count:', this.elements.edges.length);
  };

  selectTopXNodes() {
    let userNode = this.annotationsNodes;
    let conceptNodes = this.propertiesNodes;
    let edges = [...this.userEdges]; // avoid mutations
    conceptNodes.sort(function (a: any, b: any) {
      return b.data.weight - a.data.weight;
    });

    let topConcepts =
      this.topNConcepts !== 'All'
        ? conceptNodes.slice(0, this.topNConcepts)
        : conceptNodes;

    let topXNodes = userNode.concat(topConcepts);
    if (this.showUserKg || this.showDNUEngagementKg) {
      topXNodes = topXNodes.concat(this.relatedNodes);
      topXNodes = topXNodes.concat(this.categoryNodes);
    }

    const nodeIds = new Set();
    topXNodes.forEach((node) => {
      nodeIds.add(node.data.id);
    });

    let filteredEdges = edges.filter(
      (e: any) =>
        nodeIds.has(String(e.data.source)) && nodeIds.has(String(e.data.target))
    );
    console.log(filteredEdges);
    this._elements = {
      nodes: topXNodes,
      edges: filteredEdges,
      button: this.elements.button,
    };
    console.log(this._elements.nodes);
  }

  init() {
    if (this.showUserKg) {
      if (this.elements) {
        console.log('Elements passed to Cytoscape:', this.elements);
        console.log('Nodes in elemenets', this.elements.nodes);
        console.log('First Node:', this.elements.nodes[0]);
        console.log('First Node Data:', this.elements.nodes[0]?.data);

        /*this.elements.edges = this.elements.edges.filter(
        (edge) => !edge.data.isDeleted
      );
      this.elements.nodes = this.elements.nodes.filter(
        (node) => !node.data.isDeleted
      );*/
        this.annotationsNodes = this.elements.nodes.filter(
          (n) => n.data.type === 'user'
        );
        this.propertiesNodes = this.elements.nodes.filter(
          (n) => n.data.type === 'main_concept'
        );
        this.relatedNodes = this.elements.nodes.filter(
          (n) => n.data.type === 'related_concept'
        );
        this.categoryNodes = this.elements.nodes.filter(
          (n) => n.data.type === 'category'
        );
        this.userEdges = this.elements.edges;
        //this.userEdges = this.elements.edges.filter((n) => n.data.type === 'u');
        //this.userEdges = this.elements.edges.filter((n) => n.data.type === 'dnu');

        if (this.renderer.selectRootElement('#cy')) {
          let cy_container = this.renderer.selectRootElement('#cy');
          console.log(cy_container, 'cy_container');
          console.log('Annotations Nodes:', this.annotationsNodes);
          console.log('Properties Nodes:', this.propertiesNodes);
          console.log('Related nodes', this.relatedNodes);
          this.selectTopXNodes();
          this.cy = cytoscape({
            container: cy_container,
            layout: this.layout,
            minZoom: this.zoom.min,
            maxZoom: this.zoom.max,
            style: this.showAllStyle,
            elements: this._elements,
            autounselectify: true,
          });
        }
        this.cy.cxtmenu(this.default);

        if (this._elements !== undefined) {
          let nodes = this._elements.nodes;
          this.cy.ready(() => {
            let initialNodes = nodes.filter(function (e: any) {
              return e.data.type === 'user';
            });
            for (var i = 0; i < initialNodes.length; i++) {
              this.cy
                .$(`#${initialNodes[i].data.id}`)
                .successors()
                .targets()
                .style('display', 'none');
            }
            if (this.showDNU) {
              let nodesToHide = nodes.filter(function (e: any) {
                return (
                  e.data.type === 'related_concept' ||
                  e.data.type === 'category'
                );
              });
              let edgesToHide = this.userEdges.filter(function (e: any) {
                return e.data.type === 'u';
              });
              console.log(edgesToHide);
              for (var i = 0; i < nodesToHide.length; i++) {
                this.cy
                  .$(`#${nodesToHide[i].data.id}`)
                  .style('display', 'none');
              }
              for (var i = 0; i < edgesToHide.length; i++) {
                this.cy
                  .$(`#${edgesToHide[i].data.id}`)
                  .style('display', 'none');
                const targetNodeId = edgesToHide[i].data.target;
                console.log('Hiding target node:', targetNodeId);
                this.cy
                  .$(`#${edgesToHide[i].data.target}`)
                  .style('display', 'none');
              }
            } else if (this.showU) {
              let nodesToHide = nodes.filter(function (e: any) {
                return (
                  e.data.type === 'related_concept' ||
                  e.data.type === 'category'
                );
              });
              let edgesToHide = this.userEdges.filter(function (e: any) {
                return e.data.type === 'dnu';
              });
              console.log(edgesToHide);
              for (var i = 0; i < nodesToHide.length; i++) {
                this.cy
                  .$(`#${nodesToHide[i].data.id}`)
                  .style('display', 'none');
              }
              for (var i = 0; i < edgesToHide.length; i++) {
                this.cy
                  .$(`#${edgesToHide[i].data.id}`)
                  .style('display', 'none');
                const targetNodeId = edgesToHide[i].data.target;
                console.log('Hiding target node:', targetNodeId);
                this.cy
                  .$(`#${edgesToHide[i].data.target}`)
                  .style('display', 'none');
              }
            } else {
              let nodesToHide = nodes.filter(function (e: any) {
                return (
                  e.data.type === 'related_concept' ||
                  e.data.type === 'category'
                );
              });

              for (var i = 0; i < nodesToHide.length; i++) {
                this.cy
                  .$(`#${nodesToHide[i].data.id}`)
                  .style('display', 'none');
              }
            }

            for (var i = 0; i < this.annotationsNodes.length; i++) {
              this.cy
                .$(`#${this.annotationsNodes[i].data.id}`)
                .style('display', 'element');
            }
          });
        }
      }
    } else if (this.showEngagementKg) {
      if (this.elements) {
        console.log('Elements passed to Cytoscape:', this.elements);
        console.log('Nodes in elemenets', this.elements.nodes);
        console.log('First Node:', this.elements.nodes[0]);
        console.log('First Node Data:', this.elements.nodes[0]?.data);
        /*this.elements.edges = this.elements.edges.filter(
        (edge) => !edge.data.isDeleted
      );
      this.elements.nodes = this.elements.nodes.filter(
        (node) => !node.data.isDeleted
      );*/
        this.annotationsNodes = this.elements.nodes.filter(
          (n) => n.data.type === 'user'
        );
        this.propertiesNodes = this.elements.nodes.filter(
          (n) => n.data.type === 'Course'
        );
        this.userEdges = this.elements.edges;
        this.layout = {
          name: 'grid',
        };
        this.zoom = this.zoom || {
          min: 0.9,
          max: 2.0,
        };
        //this.userEdges = this.elements.edges.filter((n) => n.data.type === 'u');
        //this.userEdges = this.elements.edges.filter((n) => n.data.type === 'dnu');

        if (this.renderer.selectRootElement('#cy')) {
          let cy_container = this.renderer.selectRootElement('#cy');
          console.log(cy_container, 'cy_container');
          console.log('Annotations Nodes:', this.annotationsNodes);
          console.log('Properties Nodes:', this.propertiesNodes);
          this.selectTopXNodes();
          this.cy = cytoscape({
            container: cy_container,
            layout: this.layout,
            minZoom: this.zoom.min,
            maxZoom: this.zoom.max,
            style: this.showAllStyle,
            elements: this._elements,
            autounselectify: true,
          });
        }
        this.cy.cxtmenu(this.default);

        if (this._elements !== undefined) {
          let nodes = this._elements.nodes;
          this.cy.ready(() => {
            let initialNodes = nodes.filter(function (e: any) {
              return e.data.type === 'user';
            });
            for (var i = 0; i < initialNodes.length; i++) {
              this.cy
                .$(`#${initialNodes[i].data.id}`)
                .successors()
                .targets()
                .style('display', 'none');
            }
            let nodesToHide = nodes.filter(function (e: any) {
              return (
                e.data.type === 'related_concept' || e.data.type === 'category'
              );
            });
            for (var i = 0; i < nodesToHide.length; i++) {
              this.cy.$(`#${nodesToHide[i].data.id}`).style('display', 'none');
            }
            for (var i = 0; i < this.annotationsNodes.length; i++) {
              this.cy
                .$(`#${this.annotationsNodes[i].data.id}`)
                .style('display', 'element');
            }
          });
        }
      }
    } else if (this.showDNUEngagementKg) {
      if (this.elements) {
        console.log('Elements passed to Cytoscape:', this.elements);
        console.log('Nodes in elemenets', this.elements.nodes);
        console.log('First Node:', this.elements.nodes[0]);
        console.log('First Node Data:', this.elements.nodes[0]?.data);
        /*this.elements.edges = this.elements.edges.filter(
        (edge) => !edge.data.isDeleted
      );
      this.elements.nodes = this.elements.nodes.filter(
        (node) => !node.data.isDeleted
      );*/
        this.annotationsNodes = this.elements.nodes.filter(
          (n) => n.data.type === 'user'
        );
        this.propertiesNodes = this.elements.nodes.filter(
          (n) => n.data.type !== 'user' && n.data.type !== 'related_concept'
        );
        this.relatedNodes = this.elements.nodes.filter(
          (n) => n.data.type === 'related_concept'
        );
        this.categoryNodes = this.elements.nodes.filter(
          (n) => n.data.type === 'category'
        );
        this.userEdges = this.elements.edges;
        console.log(this.userEdges);

        //this.userEdges = this.elements.edges.filter((n) => n.data.type === 'u');
        //this.userEdges = this.elements.edges.filter((n) => n.data.type === 'dnu');

        if (this.renderer.selectRootElement('#cy')) {
          let cy_container = this.renderer.selectRootElement('#cy');
          console.log(cy_container, 'cy_container');
          console.log('Annotations Nodes:', this.annotationsNodes);
          console.log('Properties Nodes:', this.propertiesNodes);
          this.selectTopXNodes();
          this.cy = cytoscape({
            container: cy_container,
            layout: this.layout,
            minZoom: this.zoom.min,
            maxZoom: this.zoom.max,
            style: this.showAllStyle,
            elements: this._elements,
            autounselectify: true,
          });
        }
        this.cy.cxtmenu(this.default);

        if (this._elements !== undefined) {
          let nodes = this._elements.nodes;
          this.cy.ready(() => {
            let initialNodes = nodes.filter(function (e: any) {
              return e.data.type === 'user';
            });
            for (var i = 0; i < initialNodes.length; i++) {
              this.cy
                .$(`#${initialNodes[i].data.id}`)
                .successors()
                .targets()
                .style('display', 'none');
            }
            if (this.showDNU) {
              let nodesToHide = nodes.filter(function (e: any) {
                return (
                  e.data.type === 'related_concept' ||
                  e.data.type === 'category'
                );
              });
              let edgesToHide = this.userEdges.filter(function (e: any) {
                return e.data.type === 'u';
              });
              console.log(edgesToHide);
              for (var i = 0; i < nodesToHide.length; i++) {
                this.cy
                  .$(`#${nodesToHide[i].data.id}`)
                  .style('display', 'none');
              }
              for (var i = 0; i < edgesToHide.length; i++) {
                this.cy
                  .$(`#${edgesToHide[i].data.id}`)
                  .style('display', 'none');
                const targetNodeId = edgesToHide[i].data.target;
                console.log('Hiding target node:', targetNodeId);
                this.cy
                  .$(`#${edgesToHide[i].data.target}`)
                  .style('display', 'none');
              }
            } else if (this.showU) {
              let nodesToHide = nodes.filter(function (e: any) {
                return (
                  e.data.type === 'related_concept' ||
                  e.data.type === 'category'
                );
              });
              let edgesToHide = this.userEdges.filter(function (e: any) {
                return e.data.type === 'dnu';
              });
              console.log(edgesToHide);
              for (var i = 0; i < nodesToHide.length; i++) {
                this.cy
                  .$(`#${nodesToHide[i].data.id}`)
                  .style('display', 'none');
              }
              for (var i = 0; i < edgesToHide.length; i++) {
                this.cy
                  .$(`#${edgesToHide[i].data.id}`)
                  .style('display', 'none');
                const targetNodeId = edgesToHide[i].data.target;
                console.log('Hiding target node:', targetNodeId);
                this.cy
                  .$(`#${edgesToHide[i].data.target}`)
                  .style('display', 'none');
              }
            } else {
              let nodesToHide = nodes.filter(function (e: any) {
                return (
                  e.data.type === 'related_concept' ||
                  e.data.type === 'category'
                );
              });

              for (var i = 0; i < nodesToHide.length; i++) {
                this.cy
                  .$(`#${nodesToHide[i].data.id}`)
                  .style('display', 'none');
              }
            }
            for (var i = 0; i < this.annotationsNodes.length; i++) {
              this.cy
                .$(`#${this.annotationsNodes[i].data.id}`)
                .style('display', 'element');
            }
          });
        }
      }
    }
    if (this.elements) {
      // document.getElementById('cy').style.height=520+'px'

      document.getElementById('cy').style.height = this.cyHeight - 75 + 'px';
    } else {
      if (!document.getElementById('cy')) {
        //console.log("not exist")
      } else {
        console.log(
          "document.getElementById('cy')",
          document.getElementById('cy')
        );

        document.getElementById('cy').style.height = this.cyHeight + 'px';
      }
      // document.getElementById('cy').style.height=575+'px'
    }
    this.nodeSelected = false;

    console.log(this.showUserKg);
    console.log(this.showEngagementKg);
    console.log(this.showDNUEngagementKg);
  }

  render() {
    if (this.showUserKg || this.showDNUEngagementKg) {
      this.cy.on('layoutstop', () => {
        setTimeout(() => {
          this.cy.center();
          this.cy.fit(undefined, 80);
        }, 100); // 100ms delay
      });
    }

    if (this._elements !== undefined) {
      let selectedNode: any = undefined;
      this.cy.off('click');
      const userNode = this.cy.nodes().filter((n) => n.data('type') === 'user');
      if (userNode.length > 0) {
        const connectedConcepts = userNode.connectedEdges().targets();

        // If showDNU is true, only show concepts connected by non-'u' edges
        if (this.showDNU) {
          connectedConcepts
            .filter((node) => {
              const incomingEdges = node.connectedEdges(
                'edge[target = "' + node.id() + '"]'
              );
              return !incomingEdges.some((edge) => edge.data('type') === 'u');
            })
            .style('display', 'element');
        } else if (this.showU) {
          connectedConcepts
            .filter((node) => {
              const incomingEdges = node.connectedEdges(
                'edge[target = "' + node.id() + '"]'
              );
              return !incomingEdges.some((edge) => edge.data('type') === 'dnu');
            })
            .style('display', 'element');
        } else {
          connectedConcepts.style('display', 'element');
        }
      }
      this.cy.on('click', (event: any) => {
        console.log('CLICK');
        $('html,body').css('cursor', 'default');
        var node = event.target;

        // Clear any popper divs
        if (node !== this.cy) {
          if (node.isNode()) {
            const elements = document.getElementsByClassName('popper-div');
            while (elements.length > 0) {
              elements[0].parentNode.removeChild(elements[0]);
            }
          }
        }

        var eventTarget = event.target;

        if (
          eventTarget !== this.cy &&
          eventTarget.isNode() &&
          eventTarget.data('type') === 'Course' &&
          this.showDNUEngagementKg
        ) {
          const isAlreadyHighlighted =
            eventTarget.style('border-color') === 'rgb(255,165,0)';

          if (isAlreadyHighlighted) {
            // Reset styling for the course node
            eventTarget.style({
              'border-width': '2px',
              'border-color': '#000',
              'border-opacity': 0.5,
            });

            this.cy
              .nodes()
              .filter((n) => n.data('type') === 'related_concept')
              .style('display', 'none');

            this.cy
              .nodes()
              .filter((n) => n.data('type') === 'main_concept')
              .style('display', 'none');

            this.cy.edges().style('display', 'none');

            this.cy
              .nodes()
              .filter((n) => n.data('type') === 'Course')
              .style('display', 'element');

            this.cy
              .nodes()
              .filter((n) => n.data('type') === 'user')
              .style('display', 'element');

            this.cy.edges().style('display', 'element');

            const userNode = this.cy
              .nodes()
              .filter((n) => n.data('type') === 'user');

            if (userNode.length > 0) {
              let edgesToShow;
              if (this.showDNU && !this.showU) {
                edgesToShow = userNode
                  .connectedEdges()
                  .filter((e) => e.data('type') === 'dnu');
              } else if (this.showU && !this.showDNU) {
                edgesToShow = userNode
                  .connectedEdges()
                  .filter((e) => e.data('type') === 'u');
              } else {
                edgesToShow = userNode.connectedEdges();
              }

              edgesToShow.style('display', 'element');

              const nodesToShow = edgesToShow.connectedNodes();
              nodesToShow.style('display', 'element');

              const layout = this.cy.layout({
                name: 'fcose',
                // Better for larger graphs
                quality: 'proof',
                randomize: false,
                // Increase spacing between nodes
                nodeRepulsion: 10000,
                idealEdgeLength: 150,
                edgeElasticity: 0.6,
                // Tiered positioning
                nodeDimensionsIncludeLabels: true,
                // Better component handling
                packComponents: true,
                // Improved algorithm parameters for larger graphs
                numIter: 4000,
                initialEnergyOnIncremental: 0.3,
                // Improved positioning
                gravity: 0.25,
                gravityRangeCompound: 1.5,
                // Hierarchical structure
                tile: true,
                tilingPaddingVertical: 30,
                tilingPaddingHorizontal: 30,
                animationDuration: 50,
                stop: function () {
                  $('html,body').css('cursor', 'default');
                  const popperElements =
                    document.getElementsByClassName('popper-div');
                  while (popperElements.length > 0) {
                    popperElements[0].parentNode.removeChild(popperElements[0]);
                  }
                },
              });

              layout.run();
            }
          } else {
            selectedNode = {
              id: eventTarget.data('id'),
              cid: eventTarget.data('cid'),
              name: eventTarget.data('name'),
              type: eventTarget.data('type'),
              abstract: eventTarget.data('abstract'),
              mid: eventTarget.data('mid'),
              wikipedia: eventTarget.data('wikipedia'),
            };
            this.cy.edges().style('display', 'none');
            this.cy.nodes().style('display', 'none');

            // Show the course node
            eventTarget.style('display', 'element');

            const allConnectedConcepts = eventTarget.connectedEdges().targets();

            let connectedConcepts;
            if (this.showDNU && !this.showU) {
              connectedConcepts = allConnectedConcepts.filter((node) => {
                const dnuEdges = this.cy
                  .edges()
                  .filter(
                    (edge) =>
                      edge.data('type') === 'dnu' &&
                      edge.target().id() === node.id()
                  );
                return dnuEdges.length > 0; // return true only if connected node has dnu edge
              });
            } else if (!this.showDNU && this.showU) {
              connectedConcepts = allConnectedConcepts.filter((node) => {
                const uEdges = this.cy
                  .edges()
                  .filter(
                    (edge) =>
                      edge.data('type') === 'u' &&
                      edge.target().id() === node.id()
                  );
                return uEdges.length > 0;
              });
            } else {
              connectedConcepts = allConnectedConcepts;
            }

            connectedConcepts.style('display', 'element');

            // Get all edges connected to this course node
            const connectedEdges = eventTarget.connectedEdges();

            // Show only edges that are HAS_CONCEPT
            connectedEdges
              .filter((edge) => edge.data('type') === 'HAS_CONCEPT')
              .style('display', 'element');

            // Apply circle layout to connected concepts around the course node
            const nodesToLayout = connectedConcepts.union(eventTarget);
            const courseLayout = nodesToLayout.layout({
              name: 'circle',
              minDist: 50,
              padding: 100,
            });

            // Run the layout
            courseLayout.run();

            // Highlight the course node
            eventTarget.style({
              'border-width': '3px',
              'border-color': '#FFA500', // Orange highlight
              'border-opacity': 1,
            });
          }
        } else if (
          eventTarget !== this.cy &&
          eventTarget.isNode() &&
          eventTarget.data('type') === 'main_concept'
        ) {
          const isAlreadyHighlighted =
            eventTarget.style('border-color') === 'rgb(255,165,0)';

          if (isAlreadyHighlighted) {
            // Reset styling for the course node
            eventTarget.style({
              'border-width': '2px',
              'border-color': '#000',
              'border-opacity': 0.5,
            });

            this.cy
              .nodes()
              .filter((n) => n.data('type') === 'related_concept')
              .style('display', 'none');

            this.cy
              .nodes()
              .filter((n) => n.data('type') === 'category')
              .style('display', 'none');

            this.cy
              .nodes()
              .filter((n) => n.data('type') === 'main_concept')
              .style('display', 'none');

            this.cy.edges().style('display', 'none');

            this.cy
              .nodes()
              .filter((n) => n.data('type') === 'Course')
              .style('display', 'element');

            this.cy
              .nodes()
              .filter((n) => n.data('type') === 'user')
              .style('display', 'element');

            this.cy.edges().style('display', 'element');

            const userNode = this.cy
              .nodes()
              .filter((n) => n.data('type') === 'user');

            if (userNode.length > 0) {
              let edgesToShow;
              if (this.showDNU && !this.showU) {
                edgesToShow = userNode
                  .connectedEdges()
                  .filter((e) => e.data('type') === 'dnu');
              } else if (this.showU && !this.showDNU) {
                edgesToShow = userNode
                  .connectedEdges()
                  .filter((e) => e.data('type') === 'u');
              } else {
                edgesToShow = userNode.connectedEdges();
              }

              edgesToShow.style('display', 'element');

              const nodesToShow = edgesToShow.connectedNodes();
              nodesToShow.style('display', 'element');

              const layout = this.cy.layout({
                name: 'fcose',
                // Better for larger graphs
                quality: 'proof',
                randomize: false,
                // Increase spacing between nodes
                nodeRepulsion: 10000,
                idealEdgeLength: 150,
                edgeElasticity: 0.6,
                // Tiered positioning
                nodeDimensionsIncludeLabels: true,
                // Better component handling
                packComponents: true,
                // Improved algorithm parameters for larger graphs
                numIter: 4000,
                initialEnergyOnIncremental: 0.3,
                // Improved positioning
                gravity: 0.25,
                gravityRangeCompound: 1.5,
                // Hierarchical structure
                tile: true,
                tilingPaddingVertical: 30,
                tilingPaddingHorizontal: 30,
                animationDuration: 50,
                stop: function () {
                  $('html,body').css('cursor', 'default');
                  const popperElements =
                    document.getElementsByClassName('popper-div');
                  while (popperElements.length > 0) {
                    popperElements[0].parentNode.removeChild(popperElements[0]);
                  }
                },
              });

              layout.run();
            }
          } else {
            selectedNode = {
              id: eventTarget.data('id'),
              cid: eventTarget.data('cid'),
              name: eventTarget.data('name'),
              type: eventTarget.data('type'),
              abstract: eventTarget.data('abstract'),
              mid: eventTarget.data('mid'),
              wikipedia: eventTarget.data('wikipedia'),
            };
            this.cy.edges().style('display', 'none');
            this.cy.nodes().style('display', 'none');

            const connectedConcepts = eventTarget.connectedEdges().targets();
            connectedConcepts.style('display', 'element');

            const connectedEdges = eventTarget.connectedEdges();

            const incomingHasConcept = this.cy.edges().filter((edge) => {
              return (
                edge.data('type') === 'HAS_CONCEPT' &&
                edge.target().id() === eventTarget.id()
              );
            });
            incomingHasConcept.style('display', 'element');

            const connectedCourses = incomingHasConcept.sources();
            connectedCourses.style('display', 'element');

            connectedEdges
              .filter(
                (edge) =>
                  edge.data('type') === 'RELATED_TO' ||
                  edge.data('type') === 'HAS_CATEGORY'
              )
              .style('display', 'element');

            const relatedConceptNodes = this.cy
              .nodes()
              .filter(
                (n) =>
                  n.data('type') === 'related_concept' ||
                  n.data('type') === 'category'
              );
            const relevantRelatedConcepts = relatedConceptNodes.filter(
              (node) => {
                // Check if there's a path between main concept and this related concept
                const connectedToMainConcept = node
                  .connectedEdges()
                  .some((edge) => {
                    return (
                      edge.source().id() === eventTarget.id() ||
                      edge.target().id() === eventTarget.id()
                    );
                  });
                return connectedToMainConcept;
              }
            );

            // Show the related concept nodes
            relevantRelatedConcepts.style('display', 'element');

            // Show edges between related concepts and main concept
            relevantRelatedConcepts
              .connectedEdges()
              .style('display', 'element');

            const nodesToLayout = relevantRelatedConcepts.union(eventTarget);
            const relatedLayout = nodesToLayout.layout({
              name: 'fcose',
              // Better for larger graphs
              quality: 'proof',
              randomize: false,
              // Increase spacing between nodes
              nodeRepulsion: 10000,
              idealEdgeLength: 150,
              edgeElasticity: 0.6,
              // Tiered positioning
              nodeDimensionsIncludeLabels: true,
              // Better component handling
              packComponents: true,
              // Improved algorithm parameters for larger graphs
              numIter: 4000,
              initialEnergyOnIncremental: 0.3,
              // Improved positioning
              gravity: 0.25,
              gravityRangeCompound: 1.5,
              // Hierarchical structure
              tile: true,
              tilingPaddingVertical: 30,
              tilingPaddingHorizontal: 30,
              animationDuration: 50,
              stop: function () {
                $('html,body').css('cursor', 'default');
                const popperElements =
                  document.getElementsByClassName('popper-div');
                while (popperElements.length > 0) {
                  popperElements[0].parentNode.removeChild(popperElements[0]);
                }
              },
            });

            // Run the layout
            relatedLayout.run();

            eventTarget.style({
              'border-width': '3px',
              'border-color': '#FFA500', // Orange highlight
              'border-opacity': 1,
            });
          }
        } else if (eventTarget !== this.cy) {
          if (eventTarget.isNode()) {
            // Reset course node styling
            this.cy
              .nodes()
              .filter((n) => n.data('type') === 'Course')
              .style({
                'border-width': '2px',
                'border-color': '#000',
                'border-opacity': 0.5,
              });

            const selectedId = eventTarget.data('id');
            selectedNode = {
              id: eventTarget.data('id'),
              cid: eventTarget.data('cid'),
              name: eventTarget.data('name'),
              type: eventTarget.data('type'),
              abstract: eventTarget.data('abstract'),
              mid: eventTarget.data('mid'),
              wikipedia: eventTarget.data('wikipedia'),
            };

            this.elements.nodes.map((node) => {
              node.data.selected = 'u';
            });

            this.elements.nodes.some((node) => {
              if (node.data.id.toString() === selectedId.toString()) {
                node.data.selected = 's';
              }
            });
          } else {
            this.elements.nodes.map((node) => {
              node.data.selected = 'u';
            });
          }
        }

        if (selectedNode) {
          this.selectedNodeEvent.emit(selectedNode);
        } else {
          console.log('Error displaying node data');
        }
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
        if (event) {
          var node = event.target;
          if (node !== this.cy) {
            if (node.isNode() && node.data('wikipedia')) {
              let bodyElement = $('html,body');
              bodyElement.css('cursor', 'pointer');
              // $('html,body').css('cursor', 'pointer');
              let div = document.createElement('div');

              div.classList.add('popper-div');

              div.innerHTML =
                'Right click and hold to show options || Left click to show related concepts and categories';

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
            } else if (
              node.isNode() &&
              node.data('type') === 'Course' &&
              !this.showEngagementKg
            ) {
              let bodyElement = $('html,body');
              bodyElement.css('cursor', 'pointer');
              // $('html,body').css('cursor', 'pointer');
              let div = document.createElement('div');

              div.classList.add('popper-div');

              div.innerHTML = 'Left click to show concepts this course has';

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
        }
      });
      this.cy.on('cxttapstart', (event: any) => {
        let bodyElement = $('html,body');
        bodyElement.css('cursor', 'default');
        // $('html,body').css('cursor', 'default');
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
      this.cy.on('cxttapend', async (event: any) => {
        var eventTarget = event.target;
        if (
          eventTarget.data('wikipedia') &&
          eventTarget.data('wikipedia') !== '' &&
          eventTarget._private.data.notUnderstandTriggered
        ) {
          // Node contains wiki article && node selected
          const selectedId = eventTarget.data('id').toString();
          const selectedCid = eventTarget.data('cid');
          const selectedName = eventTarget.data('name').toString();
          const notUnderstandEle = {
            id: selectedId,
            cid: selectedCid,
            name: selectedName,
            status: 'notUnderstood',
          };
          this.slideConceptservice.updateDidNotUnderstandConcepts(
            notUnderstandEle
          );
          this.statusService.statusChanged();
          this.updateEdgeType(selectedId, 'dnu');
          eventTarget._private.data.notUnderstandTriggered = false;
          this.notUnderstoodConceptMsgToast();
        }
        if (
          eventTarget.data('wikipedia') &&
          eventTarget.data('wikipedia') !== '' &&
          eventTarget._private.data.understoodTriggered
        ) {
          // Node contains non-empty abstract && material recommender selected
          const selectedId = eventTarget.data('id').toString();
          const selectedCid = eventTarget.data('cid');
          const selectedName = eventTarget.data('name').toString();
          const understoodEle = {
            id: selectedId,
            cid: selectedCid,
            name: selectedName,
            status: 'understood',
          };
          this.slideConceptservice.updateUnderstoodConcepts(understoodEle);
          this.updateEdgeType(selectedId, 'u');
          eventTarget._private.data.understoodTriggered = false;
          this.understoodConceptMsgToast();
        }
        if (
          eventTarget.data('wikipedia') &&
          eventTarget.data('wikipedia') !== '' &&
          eventTarget._private.data.unReadTriggered
        ) {
          // Node contains non-empty abstract && concept recommender selected
          const selectedId = eventTarget.data('id').toString();
          const selectedCid = eventTarget.data('cid');
          const selectedName = eventTarget.data('name').toString();
          const newConceptEle = {
            id: selectedId,
            cid: selectedCid,
            name: selectedName,
            status: 'unread',
          };
          this.slideConceptservice.updateNewConcepts(newConceptEle);
          console.log(newConceptEle.id);
          this.neo4jService
            .getRelationship(newConceptEle.id.toString())
            .then((conceptRelationship) => {
              if (
                conceptRelationship.records &&
                conceptRelationship.records.length > 0
              ) {
                const relationshipId =
                  conceptRelationship.records[0].r.identity.toString();
                this.deleteRelationship(relationshipId);
              }
            })
            .catch((err) => {
              console.error('Error getting relationship:', err);
            });
          const nodeElement = this.cy.$(`#${selectedId}`);
          if (nodeElement) {
            nodeElement.style('background-color', '#2196F3');
          }
          console.log(this._elements.nodes);
          eventTarget._private.data.unReadTriggered = false;
        }
      });
    }
  }

  understoodConceptMsgToast() {
    this.messageService.add({
      key: 'statusUpdated',
      severity: 'success',
      summary: 'Understood Concepts Updated',
      detail: 'Added to understood concepts!',
    });
  }
  notUnderstoodConceptMsgToast() {
    this.messageService.add({
      key: 'statusUpdated',
      severity: 'success',
      summary: 'Not Understood Concepts Updated',
      detail: 'Added to not understood concepts!',
    });
  }

  getAllDescendants(node: any) {
    var all = [];
    getDescendants(node);

    function getDescendants(node: any) {
      let children = node.connectedEdges().targets();
      console.log('chil: ', children);
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        getDescendants(child);
        all.push(child);
      }
    }
    return all;
  }
}
