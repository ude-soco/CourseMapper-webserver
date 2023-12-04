import { Component, Input, OnInit, Renderer2 } from '@angular/core';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import cola from 'cytoscape-cola';
import coseBilkent from 'cytoscape-cose-bilkent';
import fcose from 'cytoscape-fcose';
import spread from 'cytoscape-spread';
import avsdf from 'cytoscape-avsdf';
import cxtmenu from 'cytoscape-cxtmenu';
import popper from 'cytoscape-popper';
import * as $ from 'jquery';

cytoscape.use(cxtmenu);
cytoscape.use(dagre);
cytoscape.use(spread);
cytoscape.use(cola);
cytoscape.use(avsdf);
cytoscape.use(coseBilkent);
cytoscape.use(fcose);
cytoscape.use(popper);

@Component({
  selector: 'app-cytoscape-roads',
  templateUrl: './cytoscape-roads.component.html',
  styleUrls: ['./cytoscape-roads.component.css'],
})
export class CytoscapeRoadsComponent {
  @Input() elements: any;
  @Input() style: any;
  @Input() layout: any;
  @Input() zoom: any;
  @Input() cyHeight: any;

  public cy: any;

  public _elements: any;
  checked= false;

  constructor(private renderer: Renderer2) {
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
        height: 'mapData(weight, 0, 1, 25, 100)',
        width: 'mapData(weight, 0, 1, 25, 100)',
        'text-valign': 'center',
        'text-halign': 'right',
        'text-wrap': 'wrap',
        'background-fit': 'cover',
        content: 'data(name)',
        'text-outline-width': 0.2,
        'background-color': function (elm) {
          if (elm.data().lastNode) return '#689F38';
          else if (elm.data().type === 'user') return '#FBC02D';
          else if (elm.data().type === 'main_concept') return '#2196F3';
          else if (elm.data().type === 'property') return '#0288D1';
          else if (elm.data().type === 'category') return '#9C27B0';
          else if (elm.data().type === 'Slide') return '#607D8B';
          else return '#2196F3';
        },
        'border-opacity': 0.5,
        color: '#000',
        'font-size': 16,
      },
    },
    {
      selector: 'edge',
      style: {
        content: 'data(type)',
      },
    },
  ];
  ngOnChanges() {
    // this.checked=false
      this.init();

    // this.render();
    // console.log('done render')
  }
  ngAfterContentChecked() {
    // let cyRoads = document.getElementById('cyRoads');
    // if (this.cyHeight && !this.checked) {
    //   cyRoads.style.height = this.cyHeight + 'px';
    //   this.checked=true
    //   this.init()
    // }
  }
  init() {
    let cy_container = this.renderer.selectRootElement('#cyRoads');
    if (this.elements !== undefined) {
      let cyRoads = document.getElementById('cyRoads');
      cyRoads.style.height = this.cyHeight;
      
      let nodes = [];
      let edges = [];
      let prevNode = null;
      this.elements.forEach((element) => {
        if (element) {
          element.forEach((val, valIndex) => {
            if (val) {
              if (val.type) {
                if (val.type === 'user') {
                  val.id = '0';
                }
                if (valIndex === element.length - 1) {
                  val.lastNode = true;
                  val.type = 'Recommended Concept';
                }
                let node = {
                  data: val,
                };
                nodes.push(node);
                prevNode = val;
              } else {
                if (val === 'dnu') {
                  val = 'Not Understand';
                }
                if (val === 'RELATED_TO') {
                  val = 'Related To';
                }
                if (val === 'BELONGS_TO') {
                  val = 'Belongs To';
                }
                if (val === 'CONTAINS') {
                  val = 'Contains';
                }
                let source = element[valIndex - 1].id;
                let target = element[valIndex + 1].id;
                let type = val;
                let edge = {
                  data: {
                    source: source,
                    target: target,
                    type: type,
                  },
                };
                edges.push(edge);
              }
            }
          });
        }
      });
      this._elements = {
        nodes: nodes,
        edges: edges,
      };
      try {
        this.cy = cytoscape({
          container: cy_container,
          layout: this.layout,
          minZoom: this.zoom.min,
          maxZoom: this.zoom.max,
          style: this.showAllStyle,
          elements: this._elements,
          autounselectify: true,
        });
      } catch (e) {
        console.log(e);
        this.init();
      }
      this.cy.userZoomingEnabled(false);
      if (this._elements !== undefined) {
        console.log(this._elements);
        this.cy.ready(() => {});
        this.render();
        console.log('done render');
      }
    }
  }

  render() {
    if (this._elements !== undefined) {
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
          if (node.isNode()) {
            let nodeType = node.data('type');
            let nodeName = node.data('name');
            if (nodeType === 'user') {
              nodeType = 'User node';
            } else if (nodeType === 'annotation') {
              nodeType = 'Main concept';
            } else if (nodeType === 'property') {
              nodeType = 'Related Concept';
            } else if (nodeType === 'category') {
              nodeType = 'Category';
            }
            $('html,body').css('cursor', 'pointer');
            let div = document.createElement('div');

            div.classList.add('popper-div');

            div.innerHTML = nodeType;

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
      });
    }
  }
}
