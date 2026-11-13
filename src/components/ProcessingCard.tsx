import React from 'react';
import { ProgressBar } from './ui/ProgressBar';

export interface ProcessingStage {
  label: string;
  state: 'done' | 'current' | 'todo';
}

export interface ProcessingCardProps {
  /** `02 / 03` */
  index: string;
  /** `PROCESSING CURRENT FILE` */
  heading: string;
  name: string;
  percent: number;
  stage: string;
  stages: ProcessingStage[];
}

/**
 * Active-file card: counter, file name, 8 px progress track, big percentage
 * and the three-step stage rail.
 */
export const ProcessingCard: React.FC<ProcessingCardProps> = ({
  index,
  heading,
  name,
  percent,
  stage,
  stages,
}) => (
  <div className="flex flex-col gap-3 border border-control bg-surface px-6 py-5">
    <p className="t-mono text-muted">
      {index} / {heading}
    </p>
    <p className="t-title truncate text-ink">{name}</p>
    <ProgressBar value={percent} />
    <div className="flex items-start gap-4">
      <span className="t-display w-[120px] shrink-0 text-ink">{Math.round(percent)}%</span>
      <span className="flex-1 t-small text-ink">{stage}</span>
    </div>
    <div className="flex items-center justify-between">
      {stages.map((item) => (
        <span
          key={item.label}
          className={
            item.state === 'current'
              ? 't-label uppercase text-signal-text'
              : 't-label uppercase text-muted'
          }
        >
          {item.label}
          {item.state === 'done' ? ' ✓' : ''}
        </span>
      ))}
    </div>
  </div>
);
