'use client';

import { useEffect, useRef } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Profile } from '@/content/profile';
import { sceneStore, useSceneStore } from '@/store/scene-store';
import { usePrefsStore } from '@/store/prefs-store';
import { createPointerHandlers } from '@/interaction/pointer';
import { useDockDriver } from '@/interaction/camera-dock/driver';
import { POSES } from '@/interaction/camera-dock/poses';
import { useDiegeticPresentation } from '@/interaction/camera-dock/presentation';
import { useDockPhaseTimers } from '@/interaction/camera-dock/phase-timers';
import { ContactPanel } from '@/ui/panels/ContactPanel';
import {
  CONTACT_CARD_POSITION,
  CONTACT_CARD_SIZE,
} from '@/scene/ambient/positions';

const CARD_COLOR = '#f2ead8';

export interface ContactCardProps {
  profile: Profile;
  tabIndex: number;
}

/**
 * `ContactCard` is the stray letterpress card at the front-centre of the
 * desk (brief §5.3). It replaces the retired `Notes.tsx` mesh and carries
 * the dockable `{ kind: 'contact' }` panel entry. The top face is planar
 * at the group's local origin so the artist brief's eventual bake has a
 * stable UV frame; the Stage A primitives just use a thin box.
 *
 * Dock wiring (§5.5 / P10-11):
 * - `useDockDriver` springs the group toward `POSES.contactCard` when the
 *   scene phase is `docking` and back to `CONTACT_CARD_POSITION` when
 *   closing. Reduced-motion snaps to the target in a single frame.
 * - The child group named `contactCard:face` matches `POSES.contactCard
 *   .surfaceNode`, so the P10-16 `<Html transform>` surface helper can
 *   resolve it by name without this component importing it directly.
 */
export const ContactCard = ({
  profile,
  tabIndex,
}: ContactCardProps): React.ReactElement => {
  const groupRef = useRef<THREE.Group>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const [cardWidth, cardThickness, cardDepth] = CONTACT_CARD_SIZE;

  const phase = useSceneStore((s) => s.phase);
  const isContactActive = useSceneStore(
    (s) => s.activePanel?.kind === 'contact',
  );
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);
  const presentation = useDiegeticPresentation();
  const wasActiveRef = useRef(false);

  // Diegetic body mount gate — same rule as HeroBook / ProjectBook: the
  // `<Html transform>` face-surface only mounts when the visitor is on
  // the diegetic path, this card owns the active panel, and the dock
  // spring has settled at the pose.
  const showDiegeticBody =
    isContactActive &&
    presentation === 'diegetic' &&
    (phase === 'docked' || phase === 'opening' || phase === 'open');

  // Diegetic path has no PanelFrame to drive `opening → open` /
  // `closing → closed` timers — this hook supplies them when the card
  // owns the active diegetic panel.
  useDockPhaseTimers(isContactActive && presentation === 'diegetic');

  // Focus restoration — mirror ProjectBook / SkillsCatalog / HeroBook. When
  // the panel closes, return focus to the card hotspot so keyboard users
  // stay oriented in the Tab chain.
  useEffect(() => {
    if (isContactActive && (phase === 'docked' || phase === 'opening')) {
      wasActiveRef.current = true;
    }
    if (phase === 'closed' && wasActiveRef.current) {
      anchorRef.current?.focus();
      wasActiveRef.current = false;
    }
  }, [phase, isContactActive]);

  // Dock driver — home pose is the at-rest desk anchor; target is the
  // shared "held at chest" card pose. Stage A just runs the driver; the
  // full phase-machine wire-up + `<Html transform>` mount live in P10-16.
  useDockDriver(
    groupRef,
    POSES.contactCard,
    {
      position: CONTACT_CARD_POSITION,
      rotation: [0, 0, 0],
    },
    reducedMotion,
  );

  const handlers = createPointerHandlers({ kind: 'contact' });

  const openPanel = (): void => {
    sceneStore.getState().open({ kind: 'contact' });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openPanel();
  };

  return (
    <group
      ref={groupRef}
      position={CONTACT_CARD_POSITION}
      rotation={[0, 0, 0]}
      name="contactCard"
    >
      {/* Named child group whose local origin sits at the card's top face
          (y = +thickness / 2). The camera-dock surface helper walks the
          scene graph looking for `contactCard:face` to mount the
          `<Html transform>` reading surface. */}
      <group name="contactCard:face" position={[0, cardThickness / 2, 0]}>
        <mesh {...handlers} castShadow receiveShadow>
          <boxGeometry args={[cardWidth, cardThickness, cardDepth]} />
          <meshStandardMaterial
            color={CARD_COLOR}
            roughness={0.95}
            metalness={0}
          />
        </mesh>

        {/* Diegetic reading surface — mounted flat on the card's top face
            when the dock has settled. Rotated -X/2 so the DOM renders
            perpendicular to the card surface normal (world +Y), and
            scaled so the authored DOM width maps to the card width. */}
        {showDiegeticBody ? (
          <group
            position={[0, 0.0005, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={cardWidth / POSES.contactCard.domSize.w}
          >
            <Html
              transform
              occlude={false}
              pointerEvents="auto"
              style={{
                width: `${POSES.contactCard.domSize.w}px`,
                height: `${POSES.contactCard.domSize.h}px`,
              }}
            >
              <ContactPanel
                profile={profile}
                onClose={() => sceneStore.getState().close()}
              />
            </Html>
          </group>
        ) : null}
      </group>

      {/* Zero-size DOM anchor carrying testid + tabIndex + focus ring. The
          `<Html>` portal places it at the card origin so Tab lands on the
          card position visually even though the DOM element is 0×0. */}
      <Html center>
        <div
          ref={anchorRef}
          tabIndex={tabIndex}
          role="button"
          aria-haspopup="dialog"
          aria-label={`Contact ${profile.name} — press Enter to open`}
          data-testid="contact-card"
          className="scene-focus-ring"
          onKeyDown={onKeyDown}
          style={{ width: 0, height: 0, opacity: 0 }}
        />
      </Html>
    </group>
  );
};
