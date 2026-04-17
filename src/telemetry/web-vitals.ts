'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { track as vercelTrack } from '@vercel/analytics';

type Metric = {
  id: string;
  name: string;
  value: number;
  label: 'web-vital' | 'custom';
};

export const WebVitalsReporter = (): null => {
  useReportWebVitals((metric: Metric) => {
    vercelTrack(metric.name, {
      id: metric.id,
      value: metric.value,
      label: metric.label,
    });
  });

  return null;
};
