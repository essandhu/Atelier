/**
 * Lamp world-space anchors.
 *
 * P10-14 desk rebalance — the lamp moves to the back-right of the desk so
 * the front-left quadrant opens up for the globe (architecture §8 Stage A
 * deliverable 6). Brief §5.3 fixes the base at (0.65, 0.79, -0.25) and the
 * bulb at (0.65, 1.3, -0.10); the bulb sits forward of the base so the cone
 * shade points toward the desk centre rather than straight down.
 *
 * `LAMP_BULB_POSITION` is load-bearing: `RealTimeLights` uses it for the
 * `<pointLight>` anchor, `LampBreathe` reads it to animate the emissive
 * bulb material, and `Lamp.tsx` uses it to position the bulb mesh relative
 * to the base. Every consumer MUST import from this module rather than
 * hard-coding coordinates.
 */
export const LAMP_BASE_POSITION: [number, number, number] = [0.65, 0.79, -0.25];
export const LAMP_BULB_POSITION: [number, number, number] = [0.65, 1.3, -0.1];
