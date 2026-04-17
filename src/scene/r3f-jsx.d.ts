// React 19 moved the JSX namespace into the React module; @react-three/fiber 8.x
// still augments the legacy global `JSX` namespace. Bridge both here so R3F's
// intrinsic elements (mesh, group, ambientLight, …) resolve under React 19's
// `React.JSX.IntrinsicElements`.
import type { ThreeElements } from '@react-three/fiber';

declare module 'react' {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends ThreeElements {}
  }
}
