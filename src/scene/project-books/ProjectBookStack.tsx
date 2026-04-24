'use client';

import { Html } from '@react-three/drei';
import type { Project } from '@/content/projects/schemas';
import { ProjectBook } from '@/scene/project-books/ProjectBook';
import { TAB_ORDER } from '@/interaction/tab-order';
import {
  BOOK_THICKNESS,
  MAX_BOOKS,
  STACK_BOTTOM_Y,
  STACK_CENTER_X,
  STACK_Z,
  bookYForIndex,
  yawForIndex,
} from '@/scene/project-books/stack-config';

export interface ProjectBookStackProps {
  projects: Project[];
}

// Project books are authored flat per artist brief §5.3.1 — X is the
// spine-length axis, Y is the thin stack-pitch axis, Z is the page-width
// axis. No compensating rotation is needed at stack time; each book sits
// in the stack with identity rotation plus a per-book yaw around world Y
// for visual variety.

export const ProjectBookStack = ({
  projects,
}: ProjectBookStackProps): React.ReactElement | null => {
  const visible = projects.slice(0, MAX_BOOKS);
  if (visible.length === 0) return null;

  // Html anchor sits at the centre of the visible stack height — purely a
  // testId carrier, no visual or focus contribution.
  const stackMidY =
    STACK_BOTTOM_Y + (visible.length * BOOK_THICKNESS) / 2;

  return (
    <group>
      <Html center position={[STACK_CENTER_X, stackMidY, STACK_Z]}>
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
          position={[STACK_CENTER_X, bookYForIndex(i), STACK_Z]}
          stackRotation={[0, yawForIndex(i), 0]}
          tabIndex={TAB_ORDER.projectBookStart + i}
        />
      ))}
    </group>
  );
};
