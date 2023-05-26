import { Component, EventEmitter, Input, Output, Renderer2 } from '@angular/core';

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
  styleUrls: ['./cytoscape.component.css']
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

  @Output() selectedNodeEvent: EventEmitter<object> = new EventEmitter();


  public cy: any;

  public selectedTriggered: boolean = false;

  public _elements: any;

  annotationsNodes: any[];
  propertiesNodes: any[];
  categoriesNodes: any[];
  nodeSelected: boolean;

  abstractStatusSubscription: Subscription

  constructor(private renderer: Renderer2, private abstractStatus: ConceptStatusService){
    this.abstractStatusSubscription=abstractStatus.abstractStatusObserver().subscribe(()=>{
      console.log('closed')
      document.getElementById('cy').style.width = 100 + '%';
      console.log(document.getElementById('cy').style.width = 100 + '%')
    })
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
  public showAllStyle: cytoscape.Stylesheet[] = [
    // the stylesheet for the graph
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

        'border-width': 'mapData(weight, 0, 1, 1, 3)',
        'border-opacity': 0.5,
        'text-wrap': 'wrap',

        'background-fit': 'cover',
        content: 'data(name)',
        'text-halign': 'center',
        'text-valign': 'center',
        'text-outline-width': 0.2,
        'background-color': function (elm) {
          if (elm.data().type === 'property') return '#689F38';
          else if (elm.data().type === 'category') return '#FBC02D';
          else if (elm.data().type === 'course') return '#689F38';
          else if (elm.data().type === 'topic') return '#607D8B';
          else if (elm.data().type === 'channel') return '#9C27B0';
          else if (elm.data().type === 'material') return '#607D8B';
          // "annotation"
          else return '#2196F3';
        },
        color: '#000',
        'font-size': 16,
      },
    },
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
        color: '#fff',
        'text-outline-color': '#b5b5b3',
        'text-outline-width': 1,
        'font-size': 10,
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

  ngOnInit() {}

  ngOnChanges() {
    this.init();
    this.render();
  }

  // ngAfterContentChecked() {
  //   if (!this.nodeSelected) {
  //     document.getElementById('cy').style.width = 100 + '%';
  //   }
  // }

  onResize(e) {
    if (this.nodeSelected) {
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

    if (this.topNConcepts !== 'All') {
      let topXNodes = nodes.slice(0, this.topNConcepts);
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
    } else {
      this._elements = this.elements;
    }
    console.log(this._elements.nodes)
  }

  init() {
    let cy_container = this.renderer.selectRootElement('#cy');
      if (this.elements) {
        console.log(this.elements)
        this.annotationsNodes = this.elements.nodes.filter(
          (n) => n.data.type === 'annotation'
        );
        this.propertiesNodes = this.elements.nodes.filter(
          (n) => n.data.type === 'property'
        );
        this.categoriesNodes = this.elements.nodes.filter(
          (n) => n.data.type === 'category'
        );
  
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
        if (this._elements !== undefined) {
          let nodes = this._elements.nodes;
          this.cy.ready(() => {
            let initialNodes = nodes.filter(function (e: any) {
              return e.data.type === 'annotation';
            });
            for (var i = 0; i < initialNodes.length; i++) {
              this.cy
                .$(`#${initialNodes[i].data.id}`)
                .successors()
                .targets()
                .style('display', 'none');
            }
            let nodesToHide = nodes.filter(function (e: any) {
              return e.data.type === 'property' || e.data.type === 'category';
            });
            for (var i = 0; i < nodesToHide.length; i++) {
              this.cy.$(`#${nodesToHide[i].data.id}`).style('display', 'none');
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
      // document.getElementById('cy').style.height=575+'px'
      document.getElementById('cy').style.height = this.cyHeight + 'px';
    }
    this.nodeSelected = false;

    console.log(this.showCourseKg)
    console.log(this.showMaterialKg)
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
            console.log('weight: ' + eventTarget.data('weight'));
            prevNode = eventTarget.data().id;
            selectedNode = {
              name: eventTarget.data('name'),
              type: eventTarget.data('type'),
              abstract: eventTarget.data('abstract'),
              wikipedia: eventTarget.data('wikipedia'),
            };
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
          }
        }
        this.selectedNodeEvent.emit(selectedNode);
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
}
