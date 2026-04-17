import { atelierProject } from '@/content/projects/atelier';
import { ndaEngagementProject } from '@/content/projects/nda-engagement';
import { synapseOmsProject } from '@/content/projects/synapse-oms';
import { sentinelProject } from '@/content/projects/sentinel';
import { auroraUiProject } from '@/content/projects/aurora-ui';
import type { Project } from '@/content/projects/schemas';

// Order is the on-desk Tab order: stack[0] gets tabIndex 100, stack[1] → 101,
// etc. ProjectBookStack caps at 5 (TAB_ORDER.projectBookMax - start + 1).
const projects: Project[] = [
  atelierProject,
  synapseOmsProject,
  sentinelProject,
  auroraUiProject,
  ndaEngagementProject,
];

export default projects;
