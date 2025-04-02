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
import { ConceptMapService } from 'src/app/services/concept-map-service.service';
import { getCurrentMaterial } from '../../materials/state/materials.reducer';
import { getCurrentCourseId } from 'src/app/pages/courses/state/course.reducer';
import { Subscription } from 'rxjs';
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
  selector: 'app-cytoscape',
  templateUrl: './cytoscape.component.html',
  styleUrls: ['./cytoscape.component.css'],
})
export class CytoscapeComponent {
  @Input() elements: any;
  @Input() selectedFilterValues: any;
  @Input() topNConcepts: any;
  @Input() filterUpdated: any;
  @Input() style: any;
  @Input() layout: any;
  @Input() zoom: any;
  @Input() cyHeight: any;
  // @Input() showConceptAbstract: boolean;
  @Input() showMaterialKg: boolean;
  @Input() showCourseKg: boolean;
  @Input() isDraft: boolean;

  @Output() selectedNodeEvent: EventEmitter<object> = new EventEmitter();
  @Output() conceptDeleted?: EventEmitter<string> = new EventEmitter();
  @Output() editConcept?: EventEmitter<string> = new EventEmitter();
  @Output() conceptDeletedBulk?: EventEmitter<string[]> = new EventEmitter();


  public cy: any;

  public selectedTriggered: boolean = false;

  public _elements: any;
  currentMaterial: any;
  courseId: string;
  private selectedNodeElement: any;
  annotationsNodes: any[];
  propertiesNodes: any[];
  categoriesNodes: any[];
  nodeSelected: boolean;

  abstractStatusSubscription: Subscription;
  subscriptions: Subscription = new Subscription(); // Manage subscriptions
  constructor(
    private renderer: Renderer2,
    private abstractStatus: ConceptStatusService,
    private conceptMapService: ConceptMapService,
    private store: Store<State>
  ) {
    // Subscribe to get material Data from store
    this.subscriptions.add(
      this.store.select(getCurrentMaterial).subscribe((material) => {
        if (material) {
          this.currentMaterial = material;
        }
      })
    );
    // Subscribe to get the current courseId
    this.store.select(getCurrentCourseId).subscribe((courseId) => {
      this.courseId = courseId;
    });
    this.abstractStatusSubscription = abstractStatus
      .abstractStatusObserver()
      .subscribe(() => {
        console.log('closed');
        let cyElement = document.getElementById('cy');
        //console.log("document.getElementById('cy')",document.getElementById('cy'))
        if (cyElement) {
          cyElement.style.width = 100 + '%';
        }
      });
    this.layout = {
      name: 'spread',
      minDist: 70,
      padding: 50,
    };
    this.zoom = this.zoom || {
      min: 0.1,
      max: 1.5,
    };
  }
  public irrelevantConcepts = []; // Define this property in your class
  showBulkDeletion: boolean = true; // Define this property in your class
  public showAllStyle: cytoscape.Stylesheet[] = [
    {
      selector: 'node',
      style: {
        height: function (elm) {
          let maxWeight = Number(elm.data().maxWeight);
          let minWeight = Number(elm.data().minWeight);
          let y = Number(elm.data().weight);
          let normalizedWeight = (y - minWeight) / (maxWeight - minWeight);
          let height = 75 * normalizedWeight + 25; // value between 25 and 100
          return height;
        },
        width: function (elm) {
          let maxWeight = Number(elm.data().maxWeight);
          let minWeight = Number(elm.data().minWeight);
          let x = Number(elm.data().weight);
          let normalizedWeight = (x - minWeight) / (maxWeight - minWeight);
          let width = 75 * normalizedWeight + 25; // value between 25 and 100
          return width;
        },
        // 'border-width': 'mapData(weight, 0, 1, 1, 3)',
        'border-width': (ele) => {
  if (ele.data().lastEdited === true) {
    return 8;
  } else {
    // Replicate mapData(weight, 0, 1, 1, 3)
    const weight = Number(ele.data().weight);
    return 1 + 2 * weight;
  }
},
        'border-opacity': 0.5,
        'text-wrap': 'wrap',
        'background-fit': 'cover',
        content: 'data(name)',
        'text-halign': 'center',
        'text-valign': 'center',
        'text-outline-width': 0.2,
        'border-color': (elm) => {
          
      return elm.data().lastEdited === true ? '#ffff00' : 'black';
    },

        'background-color': (elm) => {
          // First, check if the node is marked as not relevant (red)
  if (this.irrelevantConcepts.includes(elm.data().cid)) {
    return '#FF0000';
  }
          
          if (elm.data().isNew) return '#00cc00'; // Green color for new concepts
          if (elm.data().isEditing) return '#cc9900'; // Green color for new concepts
          // if (elm.data().lastEdited) return '#ff0000'; // Green color for new concepts
          if (elm.data().type === 'related_concept') return '#ce6f34';
          else if (elm.data().type === 'category') return '#FBC02D';
          else if (elm.data().type === 'course') return '#689F38';
          else if (elm.data().type === 'topic') return '#607D8B';
          else if (elm.data().type === 'channel') return '#9C27B0';
          else if (elm.data().type === 'material') return '#2196F3';
          else {
            // Check if the element's cid is in irrelevantConcepts
            if (this.irrelevantConcepts.includes(elm.data().cid)) {
              return '#FF0000'; // Red color
            } else {
              return '#2196F3'; // Default color
            }
          }
        },
        color: '#000',
        'font-size': 16,
      },
    },
    // {
    //   selector: 'node[lastEdited]',
    //   style: {
    //     'border-color': '#ffff00',  // Yellow border
    //     'border-width': 20          // Optional: adjust border width as desired
    //   }
    // },
    {
      selector: 'edge',
      style: {
        content: 'data(type)',
        'curve-style': 'bezier',
        width: 'mapData(weight, 0, 1, 0, 10)',
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

  public contextMenu = {
    menuRadius: function (ele) {
      return 100;
    },
    selector: 'node[?wikipedia]',
    commands: [
      {
        content:
          '<span style="font-size:15px;">Edit</span> <br> <i class="pi pi-file-edit" style="color:#FFFF00;"></i>',
        select: (ele) => {
          this.editConcept?.emit(ele.data().cid);
        },
      },
      {
        content:
          '<span style="font-size:15px;">Revert back to relevant</span> <br> <i class="pi pi-undo" style="color:#0000FF;"></i>',
        select: (ele) => {
          this.toggleIrrelevantConcepts(ele.data().cid, false);
        },
      },
      {
        content:
          '<span style="font-size:15px;">Mark as not relevant</span> <br> <i class="pi pi-credit-card" style="color:#FF0000;"></i>',
        select: (ele) => {
          this.toggleIrrelevantConcepts(ele.data().cid, true);
        },
      },

      // {
      //   content:
      //     '<span style="font-size:15px;">Delete</span> <br> <i class="pi pi-trash" style="color:#D32F2F;"></i>',
      //   select: (ele) => {
      //     this.conceptDeleted?.emit(ele.data().cid);
      //   },
      // },
    ],
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

  ngOnInit() {}

  ngOnChanges() {
    if (!this.showMaterialKg) {
      this.selectedFilterValues = ['main_concept'];
    }
    this.init();
    this.render();
  }

  // ngAfterContentChecked() {
  //   if (!this.nodeSelected) {
  //     document.getElementById('cy').style.width = 100 + '%';
  //   }
  // }

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

  selectTopXNodes() {
    let nodes = this.annotationsNodes;
    let edges = this.elements.edges;
    nodes.sort(function (a: any, b: any) {
      return b.data.weight - a.data.weight;
    });

    let topXNodes =
      this.topNConcepts !== 'All' ? nodes.slice(0, this.topNConcepts) : nodes;
    topXNodes = topXNodes.concat(this.propertiesNodes);
    topXNodes = topXNodes.concat(this.categoriesNodes);
    let filteredEdges = edges.filter(
      (e: any) =>
        topXNodes.map((n: any) => n.data.id).includes(e.data.source) &&
        topXNodes.map((n: any) => n.data.id).includes(e.data.target)
    );
    this._elements = {
      nodes: topXNodes,
      edges: filteredEdges,
      button: this.elements.button,
    };
    console.log(this._elements.nodes);
  }

  init() {
    if (this.elements) {
      this.annotationsNodes = this.elements.nodes.filter(
        (n) => n.data.type === 'main_concept'
      );
      this.propertiesNodes = this.elements.nodes.filter(
        (n) => n.data.type === 'related_concept'
      );
      this.categoriesNodes = this.elements.nodes.filter(
        (n) => n.data.type === 'category'
      );

      if (this.renderer.selectRootElement('#cy')) {
        let cy_container = this.renderer.selectRootElement('#cy');
        console.log(cy_container, 'cy_container');
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
        if (this.isDraft) {
          this.cy.cxtmenu(this.contextMenu);
        }
      }

      if (this._elements !== undefined) {
        let nodes = this._elements.nodes;
        this.cy.ready(() => {
          let initialNodes = nodes.filter(function (e: any) {
            return e.data.type === 'main_concept';
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

    // function filterData(cy: any, types: string[]) {
    //   var nodes = cy
    //     .nodes()
    //     .filter(
    //       (node: {
    //         data: () => { (): any; new (): any; type: string };
    //         style: () => { (): any; new (): any; display: string };
    //       }) => {
    //         return types.includes(node.data().type);
    //       }
    //     );

    //   console.log('visible nodes: ', nodes);

    //   console.log(
    //     'display: ',
    //     nodes.map(
    //       (n: { style: () => { (): any; new (): any; display: any } }) =>
    //         n.style().display
    //     )
    //   );

    //   var edges = cy
    //     .edges()
    //     .filter(
    //       (edge: {
    //         data: () => { (): any; new (): any; source: any; target: any };
    //       }) =>
    //         nodes
    //           .map(
    //             (n: { data: () => { (): any; new (): any; id: any } }) =>
    //               n.data().id
    //           )
    //           .includes(edge.data().source) &&
    //         nodes
    //           .map(
    //             (n: { data: () => { (): any; new (): any; id: any } }) =>
    //               n.data().id
    //           )
    //           .includes(edge.data().target)
    //     );

    //   let _nodes = nodes.map((n: { data: any }) => {
    //     return { data: n.data() };
    //   });
    //   let _edges = edges.map((e: { data: any }) => {
    //     return { data: e.data() };
    //   });
    //   return { nodes: _nodes, edges: _edges };
    // }
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
    console.log(this.showCourseKg);
    console.log(this.showMaterialKg);
  }

  render() {
    if (this._elements !== undefined) {
      let selectedNode: any = undefined;
      var prevNode: any = undefined;

      let children: any = undefined;

      this.cy.off('click');
      this.cy.on('click', (event: any) => {
        var eventTarget = event.target;
        document.getElementById('cy').style.width = 100 + '%';
        this.nodeSelected = false;
        if (eventTarget !== this.cy) {
          if (eventTarget.isNode()) {
            // If there is a previously selected node, reset its border style.
            if (this.selectedNodeElement) {
              this.selectedNodeElement.style('border-color', '');
              this.selectedNodeElement.style('border-width', '');
            }
            console.log('weight: ' + eventTarget.data('weight'));
            prevNode = eventTarget.data().id;
            
            selectedNode = {
              id: eventTarget.data('id'),
              cid: eventTarget.data('cid'),
              name: eventTarget.data('name'),
              type: eventTarget.data('type'),
              abstract: eventTarget.data('abstract'),
              wikipedia: eventTarget.data('wikipedia'),
            };
            
            eventTarget.style('border-color', 'yellow');
            eventTarget.style('border-width', '7px');
            // Store the reference for later deselection
          this.selectedNodeElement = eventTarget;
            children = eventTarget
              .connectedEdges()
              .targets()
              .filter(
                (node: { data: () => { (): any; new (): any; type: any } }) =>
                  this.selectedFilterValues.includes(node.data().type) &&
                  node.data().name !== eventTarget.data().name
              );
            if (children.hidden()) {
              children.style('display', 'element');
            } else {
              children.style('display', 'none');
            }
            if (document.getElementById('cy')) {
              setTimeout(() => {
                let abstractContainer = document.getElementById(
                  'abstractBlockContainer'
                );
                document.getElementById('cy').style.width = 100 + '%';
                let currentWidth = document.getElementById('cy').clientWidth;
                document.getElementById('cy').style.width =
                  currentWidth - abstractContainer.clientWidth - 20 + 'px';
                this.nodeSelected = true;
              }, 0);
            }
          } else {
            prevNode = undefined;
            // If a non-node is clicked, reset the selected node's border.
          if (this.selectedNodeElement) {
            this.selectedNodeElement.style('border-color', '');
            this.selectedNodeElement.style('border-width', '');
            this.selectedNodeElement = null;
          }
          }
        }
        this.selectedNodeEvent.emit(selectedNode);
        this.logUserViewedConcept(selectedNode);
        selectedNode = undefined;
      });
    }
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
  async logUserViewedConcept(selectedNode) {
    try {
      if (this.showCourseKg && !this.showMaterialKg) {
        const payload = {
          concept: selectedNode,
          courseId: this.courseId,
        };
        this.conceptMapService.logViewConceptCKG(payload).subscribe();
      } else if (this.showMaterialKg && !this.showCourseKg) {
        const payload = {
          concept: selectedNode,
          courseId: this.courseId,
          materialId: this.currentMaterial._id,
        };
        this.conceptMapService.logViewConceptMKG(payload).subscribe();
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  toggleIrrelevantConcepts(cid: string, add: boolean = true) {

    //reset after bulk deletion
    if (!this.showBulkDeletion) {
      this.irrelevantConcepts = [];
      this.showBulkDeletion = true;
    }

    if (add) {
      // Check if the array already contains the element
      if (!this.irrelevantConcepts.includes(cid)) {
        this.irrelevantConcepts.push(cid);
      }
    } else {
      // Remove the element if it exists
      const index = this.irrelevantConcepts.indexOf(cid);
      if (index > -1) {
        this.irrelevantConcepts.splice(index, 1);
      }
    }



  }

  deleteIrrelevant() {
    this.showBulkDeletion = false;
    this.conceptDeletedBulk.emit(this.irrelevantConcepts);
  }
}
