import cytoscape from 'cytoscape';

/**
 * Cytoscape configuration for User PKG
 */

export const CYTOSCAPE_ZOOM_CONFIG = {
  min: 0.3,
  max: 3.0,
  wheelSensitivity: 0.2
};

export const CONCENTRIC_LAYOUT_CONFIG = {
  name: 'concentric',
  fit: true,
  padding: 80,
  startAngle: 0,
  sweep: undefined,
  clockwise: true,
  equidistant: false,
  minNodeSpacing: 120,
  concentric: (node: any) => {
    if (node.data().type === 'user') return 3;
    return 1;
  },
  levelWidth: () => 1,
  animate: false,
};

export const CONTEXT_MENU_CONFIG = {
  menuRadius: 100,
  fillColor: 'rgba(0, 0, 0, 0.75)',
  activeFillColor: 'rgba(59, 130, 246, 0.85)',
  activePadding: 20,
  indicatorSize: 24,
  separatorWidth: 3,
  spotlightPadding: 4,
  adaptativeNodeSpotlightRadius: false,
  minSpotlightRadius: 24,
  maxSpotlightRadius: 38,
  openMenuEvents: 'cxttapstart taphold',
  itemColor: 'white',
  itemTextShadowColor: 'transparent',
  zIndex: 9999,
  atMouse: false,
  outsideMenuCancel: false,
};

export function getCytoscapeStyles(): cytoscape.Stylesheet[] {
  return [
    {
      selector: 'node',
      style: {
        'height': (elm: any) => {
          const baseSize = 60;
          const courseCount = elm.data().allCourseIds?.length || 1;
          const additionalSize = Math.min((courseCount - 1) * 8, 24);
          return baseSize + additionalSize;
        },
        'width': (elm: any) => {
          const baseSize = 60;
          const courseCount = elm.data().allCourseIds?.length || 1;
          const additionalSize = Math.min((courseCount - 1) * 8, 24);
          return baseSize + additionalSize;
        },
        'border-width': '3px',
        'border-opacity': 1,
        'text-wrap': 'wrap',
        'text-max-width': '100px',
        'background-fit': 'cover',
        'content': 'data(name)',
        'text-halign': 'center',
        'text-valign': 'bottom',
        'text-margin-y': 5,
        'text-outline-width': 2,
        'text-outline-color': '#fff',
        'background-color': '#3B82F6',
        'border-color': '#1E40AF',
        'color': '#000',
        'font-size': 14,
        'font-weight': 'bold',
      },
    },
    {
      selector: 'node[type="user"]',
      style: {
        'height': 70,
        'width': 70,
        'shape': 'ellipse',
        'background-color': '#9B59B6',
        'border-color': '#7D3C98',
        'content': 'data(initials)',
        'text-valign': 'center',
        'text-halign': 'center',
        'color': 'white',
        'font-size': '26px',
        'font-weight': '400',
      
        'text-margin-y': '0',
        'text-outline-width': 0,
        'text-outline-color': 'transparent'
      },
    },
    {
      selector: 'node[type="course"]',
      style: {
        'height': 80,
        'width': 80,
        'font-size': 14,
        'shape': 'ellipse',
        'background-color': '#6B5D3F',
        'border-color': '#4A4030',
        'border-width': 3,
      },
    },
    {
      selector: 'node[relationshipType="u"]',
      style: {
        'background-color': '#16A34A',
        'border-color': '#15803D',
      },
    },
    {
      selector: 'node[relationshipType="dnu"]',
      style: {
        'background-color': '#DC2626',
        'border-color': '#991B1B',
      },
    },
    {
      selector: 'edge',
      style: {
        'curve-style': 'bezier',
        'width': 3,
        'target-arrow-shape': 'triangle',
        'target-arrow-color': '#9CA3AF',
        'line-color': '#9CA3AF',
        'color': '#374151',
        'text-outline-color': '#fff',
        'text-outline-width': 2,
        'font-size': 11,
        'text-rotation': 'autorotate',
        'font-weight': 'bold',
      },
    },
    {
      selector: 'edge[label]',
      style: {
        'content': 'data(label)',
      },
    },
    {
      selector: 'edge[type="u"]',
      style: {
        'line-color': '#16A34A',
        'target-arrow-color': '#16A34A',
        'color': '#15803D',
      },
    },
    {
      selector: 'edge[type="dnu"]',
      style: {
        'line-color': '#DC2626',
        'target-arrow-color': '#DC2626',
        'color': '#991B1B',
      },
    },
    {
      selector: 'edge[label="related_to"]',
      style: {
        'line-color': '#9CA3AF',
        'target-arrow-color': '#9CA3AF',
        'color': '#6B7280',
        'line-style': 'dotted',
        'width': 2,
      },
    },
    {
      selector: ':selected',
      style: {
        'border-width': 4,
        'border-color': '#000',
      },
    },
  ];
}
