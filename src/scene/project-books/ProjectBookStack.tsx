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

// The ProjectBook's inner geometry is authored in an "upright" frame (thin X
// = spine thickness, tall Y = long edge, Z = depth). To stack books flat we
// wrap each instance in a group whose Euler re-orients local axes to world:
//
//   book-X (thin, 0.022) → world Y (vertical — the stack-pitch axis)
//   book-Y (long, 0.20)  → world X (book's cover reads wide from the camera)
//   book-Z (depth, 0.16) → world Z (spine stripe ends up on the +Z face,
//                                    i.e. toward the camera)
//
// With Three.js's default XYZ Euler order (v' = Rx * Ry * Rz * v), the
// composite `[0, π + yaw, π/2]` applies Z+90° first (laying the book flat),
// then Y+180° (flipping the spine stripe from the back face to the front),
// then the per-book yaw on top. See stack-config.yawForIndex for the yaw
// pattern and the unit test in stack-config.test.ts for numeric coverage.
const STACK_ROT_X = 0;
const STACK_ROT_Z = Math.PI / 2;

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
        <group
          key={project.id}
          position={[STACK_CENTER_X, bookYForIndex(i), STACK_Z]}
          rotation={[STACK_ROT_X, Math.PI + yawForIndex(i), STACK_ROT_Z]}
        >
          <ProjectBook
            project={project}
            stackIndex={i}
            position={[0, 0, 0]}
            tabIndex={TAB_ORDER.projectBookStart + i}
          />
        </group>
      ))}
    </group>
  );
};
