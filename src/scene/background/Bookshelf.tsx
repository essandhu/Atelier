'use client';

import { useMemo } from 'react';
import {
  BOOKSHELF_POSITION,
  BOOKSHELF_SIZE,
} from '@/scene/background/positions';

const SHELF_BOARDS = 3;
const SHELF_BOARD_THICKNESS = 0.03;
const BOOK_PALETTE = [
  '#5a3c2a',
  '#2e3a2e',
  '#4a2e2e',
  '#3a3a4a',
  '#6a5a3a',
];
const BOOKS_PER_SHELF = 7;

interface BookSpec {
  x: number;
  width: number;
  height: number;
  color: string;
}

const buildShelfBooks = (
  shelfWidth: number,
  seed: number,
): readonly BookSpec[] => {
  const usable = shelfWidth * 0.9;
  const baseSlot = usable / BOOKS_PER_SHELF;
  const start = -usable / 2 + baseSlot / 2;
  // Deterministic pseudo-random from seed so shelf tiers vary without runtime RNG.
  const rand = (i: number, salt: number): number => {
    const x = Math.sin(seed * 97.13 + i * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return Array.from({ length: BOOKS_PER_SHELF }, (_, i) => {
    const widthJitter = 0.75 + rand(i, 1) * 0.4; // 0.75–1.15
    const heightJitter = 0.7 + rand(i, 2) * 0.5; // 0.7–1.2
    return {
      x: start + i * baseSlot,
      width: baseSlot * widthJitter * 0.85,
      height: heightJitter * 0.22,
      color: BOOK_PALETTE[Math.floor(rand(i, 3) * BOOK_PALETTE.length)]!,
    };
  });
};

export const Bookshelf = (): React.ReactElement => {
  const [width, height, depth] = BOOKSHELF_SIZE;
  const halfH = height / 2;

  const shelfTiers = useMemo(() => {
    const spacing = height / (SHELF_BOARDS + 1);
    return Array.from({ length: SHELF_BOARDS }, (_, tierIdx) => {
      const y = -halfH + spacing * (tierIdx + 1);
      return { y, books: buildShelfBooks(width, tierIdx + 1) };
    });
  }, [width, height, halfH]);

  return (
    <group position={BOOKSHELF_POSITION}>
      {/* Soft-focus wood carcass. */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#3a2a1e" roughness={0.9} />
      </mesh>

      {/* Horizontal shelf boards. */}
      {shelfTiers.map((tier, i) => (
        <mesh
          key={`shelf-${i}`}
          position={[0, tier.y, depth / 2 - 0.01]}
        >
          <boxGeometry
            args={[width * 0.96, SHELF_BOARD_THICKNESS, depth * 0.8]}
          />
          <meshStandardMaterial color="#2a1d14" roughness={0.85} />
        </mesh>
      ))}

      {/* Books per shelf — sit on top of each board. */}
      {shelfTiers.flatMap((tier, tierIdx) =>
        tier.books.map((book, bookIdx) => (
          <mesh
            key={`book-${tierIdx}-${bookIdx}`}
            position={[
              book.x,
              tier.y + SHELF_BOARD_THICKNESS / 2 + book.height / 2,
              depth / 2 - 0.04,
            ]}
          >
            <boxGeometry args={[book.width, book.height, 0.12]} />
            <meshStandardMaterial color={book.color} roughness={0.7} />
          </mesh>
        )),
      )}
    </group>
  );
};
