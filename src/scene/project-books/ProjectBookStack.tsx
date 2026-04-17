'use client';

import { Html } from '@react-three/drei';
import type { Project } from '@/content/projects/schemas';
import { ProjectBook } from '@/scene/project-books/ProjectBook';
import { spineDimensions } from '@/scene/project-books/spine-design';
import { TAB_ORDER } from '@/interaction/tab-order';
import {
  BOOK_GAP,
  MAX_BOOKS,
  STACK_CENTER_X,
  STACK_Z,
} from '@/scene/project-books/stack-config';

// Desk surface y ≈ 0.75 + 0.04 (half-height) ≈ 0.79. Computed here rather than
// in stack-config so the dimension source (spine-design) stays in the scene
// layer and stack-config stays a pure-constants module.
const STACK_Y =
  0.79 +
  spineDimensions({
    color: '#000',
    material: 'cloth',
    accent: false,
  }).height /
    2;

export interface ProjectBookStackProps {
  projects: Project[];
}

export const ProjectBookStack = ({
  projects,
}: ProjectBookStackProps): React.ReactElement | null => {
  const visible = projects.slice(0, MAX_BOOKS);
  if (visible.length === 0) return null;

  const dims = spineDimensions(visible[0].spine);
  const pitch = dims.width + BOOK_GAP;
  const totalWidth = visible.length * pitch - BOOK_GAP;
  const startX = STACK_CENTER_X - totalWidth / 2 + dims.width / 2;

  return (
    <group>
      <Html center position={[STACK_CENTER_X, STACK_Y, STACK_Z]}>
        <div
          data-testid="project-book-stack"
          aria-hidden="true"
          style={{ width: 0, height: 0, opacity: 0 }}
        />
      </Html>
      {visible.map((project, i) => (
        <ProjectBook
          key={project.id}
          project={project}
          stackIndex={i}
          position={[startX + i * pitch, STACK_Y, STACK_Z]}
          tabIndex={TAB_ORDER.projectBookStart + i}
        />
      ))}
    </group>
  );
};
