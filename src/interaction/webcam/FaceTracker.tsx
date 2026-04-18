'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { parallaxStore } from '@/store/parallax-store';
import {
  poseToOffset,
  createPoseFilter,
  type Pose,
} from '@/interaction/webcam/parallax';

const loadVision = () => import('@mediapipe/tasks-vision');

const CDN_WASM_BASE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm';
const CDN_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

const LOCAL_WASM_BASE = '/scene/mediapipe/wasm';
const LOCAL_MODEL_URL = '/scene/mediapipe/face_landmarker.task';

const FRAME_BUDGET_MS = 16;
const FRAME_DROP_SAMPLE_WINDOW_MS = 5000;

interface FaceLandmarkerLike {
  detectForVideo(video: HTMLVideoElement, timestamp: number): {
    facialTransformationMatrixes?: Array<{ data: number[] }>;
  };
  close(): void;
}

export interface FaceTrackerProps {
  stream: MediaStream;
  onFrameDrop?: (sampledFps: number) => void;
  onError?: (err: Error) => void;
}

type VideoFrameCallbackHandle = {
  cancel: (video: HTMLVideoElement) => void;
};

const startVideoLoop = (
  video: HTMLVideoElement,
  tick: (now: number) => void,
): VideoFrameCallbackHandle => {
  type VideoWithRvfc = HTMLVideoElement & {
    requestVideoFrameCallback?: (cb: (now: number) => void) => number;
    cancelVideoFrameCallback?: (id: number) => void;
  };
  const v = video as VideoWithRvfc;
  if (typeof v.requestVideoFrameCallback === 'function') {
    let id: number | null = null;
    const loop = (now: number) => {
      tick(now);
      id = v.requestVideoFrameCallback!(loop);
    };
    id = v.requestVideoFrameCallback(loop);
    return {
      cancel: (el) => {
        if (id !== null) {
          const elV = el as VideoWithRvfc;
          elV.cancelVideoFrameCallback?.(id);
        }
      },
    };
  }
  let raf = requestAnimationFrame(function tickRaf(now) {
    tick(now);
    raf = requestAnimationFrame(tickRaf);
  });
  return {
    cancel: () => cancelAnimationFrame(raf),
  };
};

/**
 * Extract yaw/pitch from a MediaPipe facialTransformationMatrix (column-major
 * mat4). Depth comes from translation z (meters from camera).
 */
const matrixToPose = (matrixData: number[]): Pose => {
  const m = new THREE.Matrix4().fromArray(matrixData);
  const euler = new THREE.Euler().setFromRotationMatrix(m, 'YXZ');
  // translation.z lives at element 14 of a column-major mat4
  const depth = matrixData[14] ?? 0;
  return { yaw: euler.y, pitch: euler.x, depth };
};

/**
 * Opt-in webcam parallax. Owns:
 *  - a hidden `<video>` bound to the caller-owned `MediaStream`,
 *  - a lazy-loaded MediaPipe Face Landmarker instance,
 *  - the per-frame detect loop that writes offsets into `parallaxStore`.
 *
 * Does NOT own the stream — teardown is the caller's responsibility.
 */
export const FaceTracker = ({
  stream,
  onFrameDrop,
  onError,
}: FaceTrackerProps): React.ReactElement => {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Stash callbacks in refs so the mount effect only depends on `stream`.
  // Otherwise arrow-function props change every parent render and churn the
  // MediaPipe instance each tick.
  const onFrameDropRef = useRef(onFrameDrop);
  const onErrorRef = useRef(onError);
  onFrameDropRef.current = onFrameDrop;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    let landmarker: FaceLandmarkerLike | null = null;
    let videoLoop: VideoFrameCallbackHandle | null = null;
    const videoAtMount = videoRef.current;
    const filter = createPoseFilter();
    let prevOffset = { x: 0, y: 0, z: 0 };
    let lastTickMs: number | null = null;

    let windowStart = performance.now();
    let frameCount = 0;
    let frameDurationSum = 0;

    const resolveWasmBase = async (): Promise<string> => {
      try {
        const res = await fetch(
          `${LOCAL_WASM_BASE}/vision_wasm_internal.js`,
          { method: 'HEAD' },
        );
        if (res.ok) return LOCAL_WASM_BASE;
      } catch {
        /* fall through to CDN */
      }
      return CDN_WASM_BASE;
    };

    const resolveModel = async (): Promise<string> => {
      try {
        const res = await fetch(LOCAL_MODEL_URL, { method: 'HEAD' });
        if (res.ok) return LOCAL_MODEL_URL;
      } catch {
        /* fall through to CDN */
      }
      return CDN_MODEL_URL;
    };

    const init = async (): Promise<void> => {
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      try {
        await video.play();
      } catch (err) {
        onErrorRef.current?.(err as Error);
        return;
      }

      try {
        const vision = await loadVision();
        const wasmBase = await resolveWasmBase();
        const modelUrl = await resolveModel();
        const filesetResolver = await vision.FilesetResolver.forVisionTasks(
          wasmBase,
        );
        if (cancelled) return;
        landmarker = (await vision.FaceLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: { modelAssetPath: modelUrl },
            runningMode: 'VIDEO',
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: true,
            numFaces: 1,
          },
        )) as unknown as FaceLandmarkerLike;
      } catch (err) {
        if (!cancelled) onErrorRef.current?.(err as Error);
        return;
      }

      if (cancelled) return;

      videoLoop = startVideoLoop(video, (now) => {
        if (cancelled || !landmarker) return;
        const tickStart = performance.now();
        let result: ReturnType<FaceLandmarkerLike['detectForVideo']> | null =
          null;
        try {
          result = landmarker.detectForVideo(video, now);
        } catch (err) {
          onErrorRef.current?.(err as Error);
          return;
        }
        const matrices = result?.facialTransformationMatrixes ?? [];
        if (matrices.length === 0 || !matrices[0]) return;

        const pose = matrixToPose(matrices[0].data);
        const dt =
          lastTickMs === null ? 1 / 30 : Math.max(0.001, (now - lastTickMs) / 1000);
        lastTickMs = now;
        const offset = poseToOffset(pose, prevOffset, dt, filter);
        prevOffset = offset;
        parallaxStore.getState().setOffset(offset);

        const tickDuration = performance.now() - tickStart;
        frameCount += 1;
        frameDurationSum += tickDuration;
        const windowElapsed = performance.now() - windowStart;
        if (windowElapsed >= FRAME_DROP_SAMPLE_WINDOW_MS) {
          const avgDuration = frameDurationSum / Math.max(1, frameCount);
          if (avgDuration > FRAME_BUDGET_MS) {
            const sampledFps = frameCount / (windowElapsed / 1000);
            onFrameDropRef.current?.(sampledFps);
          }
          windowStart = performance.now();
          frameCount = 0;
          frameDurationSum = 0;
        }
      });
    };

    void init();

    return () => {
      cancelled = true;
      if (videoLoop && videoAtMount) videoLoop.cancel(videoAtMount);
      landmarker?.close();
      parallaxStore.getState().reset();
      if (videoAtMount) videoAtMount.srcObject = null;
    };
  }, [stream]);

  return (
    <video
      ref={videoRef}
      data-testid="face-tracker-video"
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: 'none',
        left: -9999,
      }}
    />
  );
};
