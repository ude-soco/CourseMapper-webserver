import { CONTEXT_MENU_CONFIG } from '../cytoscape.config';
import { getNodeStatus } from './graph.utils';
import { hasCourseConnection } from './course-node.utils';
import { checkForRelatedConcepts } from './related-concepts.utils';
import { ConceptRecord } from '../../types/user-pkg.types';

export interface ContextMenuCallbacks {
  onStatusChange: (concept: any, status: 'u' | 'dnu' | 'new') => void;
  onToggleCourse: (node: any) => void;
  onToggleRelated: (node: any) => void;
}

/**
 * Initialize context menus for concept and course nodes
 */
export function initializeContextMenu(
  cy: any, 
  rawConceptRecords: ConceptRecord[], 
  callbacks: ContextMenuCallbacks
): void {
  destroyExistingMenu(cy);

  // Context menu for concept nodes (main_concept and related_concept)
  cy.cxtmenu({
    ...CONTEXT_MENU_CONFIG,
    selector: 'node[type="main_concept"], node[type="related_concept"]',
    commands: (ele: any) => getCommandsForConcept(ele, cy, rawConceptRecords, callbacks),
  });

  // Context menu for course nodes
  cy.cxtmenu({
    ...CONTEXT_MENU_CONFIG,
    selector: 'node[type="course"]',
    commands: (ele: any) => getCommandsForCourse(ele, callbacks),
  });
}

function destroyExistingMenu(cy: any): void {
  if (cy.cxtmenu) {
    try {
      cy.cxtmenu('destroy');
    } catch (e) {
      // Ignore if no menu exists
    }
  }
}

function getCommandsForConcept(
  ele: any, 
  cy: any, 
  rawConceptRecords: ConceptRecord[], 
  callbacks: ContextMenuCallbacks
): any[] {
  const currentStatus = getNodeStatus(ele);
  const commands = [];

  // Status change commands
  commands.push(...getStatusCommands(currentStatus, ele, callbacks));

  // Course toggle command
  commands.push(getToggleCourseVisibilityCommand(ele, cy, rawConceptRecords, callbacks));

  // Related concepts command (if applicable)
  const relatedCommand = getRelatedConceptsCommand(ele, cy, rawConceptRecords, callbacks);
  if (relatedCommand) {
    commands.push(relatedCommand);
  }

  return commands;
}

function getCommandsForCourse(
  ele: any,
  callbacks: ContextMenuCallbacks
): any[] {
  const courseData = ele.data();
  
  return [
    {
      content: '<span style="font-size:14px;">View Course</span> <br> <i class="pi pi-external-link" style="color:#3B82F6;"></i>',
      select: () => {
        console.log('[Context Menu] View course:', courseData);
        // TODO: Implement navigation to course
      },
    },
    {
      content: '<span style="font-size:14px;">Course Details</span> <br> <i class="pi pi-info-circle" style="color:#6B7280;"></i>',
      select: () => {
        console.log('[Context Menu] Course details:', courseData);
        // TODO: Implement course details panel
      },
    },
  ];
}

function getStatusCommands(
  currentStatus: string, 
  ele: any, 
  callbacks: ContextMenuCallbacks
): any[] {
  const statusCommands: Record<string, any[]> = {
    'u': [
      {
        content: '<span style="font-size:14px;">Not Understood</span> <br> <i class="pi pi-times" style="color:#DC2626;"></i>',
        select: () => callbacks.onStatusChange(ele.data(), 'dnu'),
      },
      {
        content: '<span style="font-size:14px;">New</span> <br> <i class="pi pi-circle" style="color:#3B82F6;"></i>',
        select: () => callbacks.onStatusChange(ele.data(), 'new'),
      },
    ],
    'dnu': [
      {
        content: '<span style="font-size:14px;">Understood</span> <br> <i class="pi pi-check" style="color:#16A34A;"></i>',
        select: () => callbacks.onStatusChange(ele.data(), 'u'),
      },
      {
        content: '<span style="font-size:14px;">New</span> <br> <i class="pi pi-circle" style="color:#3B82F6;"></i>',
        select: () => callbacks.onStatusChange(ele.data(), 'new'),
      },
    ],
    'new': [
      {
        content: '<span style="font-size:14px;">Understood</span> <br> <i class="pi pi-check" style="color:#16A34A;"></i>',
        select: () => callbacks.onStatusChange(ele.data(), 'u'),
      },
      {
        content: '<span style="font-size:14px;">Not Understood</span> <br> <i class="pi pi-times" style="color:#DC2626;"></i>',
        select: () => callbacks.onStatusChange(ele.data(), 'dnu'),
      },
    ],
  };

  return statusCommands[currentStatus] || statusCommands['new'];
}

function getToggleCourseVisibilityCommand(
  ele: any, 
  cy: any, 
  rawConceptRecords: ConceptRecord[], 
  callbacks: ContextMenuCallbacks
): any {
  const hasCourseConn = hasCourseConnection(cy, ele, rawConceptRecords);
  
  return {
    content: hasCourseConn 
      ? '<span style="font-size:14px;">Hide Course</span> <br> <i class="pi pi-eye-slash" style="color:#6B7280;"></i>'
      : '<span style="font-size:14px;">Show Course</span> <br> <i class="pi pi-graduation-cap" style="color:#6B5D3F;"></i>',
    select: () => callbacks.onToggleCourse(ele),
  };
}

function getRelatedConceptsCommand(
  ele: any, 
  cy: any, 
  rawConceptRecords: ConceptRecord[],
  callbacks: ContextMenuCallbacks
): any {
  // Related concepts are fetched on-demand, so always show the option
  const hasRelatedVisible = checkForRelatedConcepts(cy, ele);
  
  return {
    content: hasRelatedVisible 
      ? '<span style="font-size:14px;">Hide Related</span> <br> <i class="pi pi-link" style="color:#6B7280;"></i>'
      : '<span style="font-size:14px;">Show Related</span> <br> <i class="pi pi-link" style="color:#8B5CF6;"></i>',
    select: () => callbacks.onToggleRelated(ele),
  };
}
