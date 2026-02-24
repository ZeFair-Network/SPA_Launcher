/**
 * MCProgressBar - Minecraft-style progress bar
 * Supports XP bar, health bar, and custom styles
 */

import React from 'react';
import './MCProgressBar.css';

export interface MCProgressBarProps {
  value: number;
  max?: number;
  type?: 'xp' | 'health' | 'hunger' | 'default';
  showLabel?: boolean;
  label?: string;
  segmented?: boolean;
  segments?: number;
  className?: string;
  animated?: boolean;
}

const MCProgressBar: React.FC<MCProgressBarProps> = ({
  value,
  max = 100,
  type = 'default',
  showLabel = false,
  label,
  segmented = false,
  segments = 10,
  className = '',
  animated = true,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const filledSegments = segmented ? Math.ceil((percentage / 100) * segments) : 0;

  return (
    <div className={`mc-progress-wrapper ${className}`}>
      {showLabel && (
        <div className="mc-progress-label">
          {label || `${Math.round(percentage)}%`}
        </div>
      )}

      <div
        className={`
          mc-progress
          mc-progress--${type}
          ${segmented ? 'mc-progress--segmented' : ''}
          ${animated ? 'mc-progress--animated' : ''}
        `.trim().replace(/\s+/g, ' ')}
      >
        {/* Background */}
        <div className="mc-progress__bg"></div>

        {/* Fill */}
        <div
          className="mc-progress__fill"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          {/* Shine effect */}
          <div className="mc-progress__shine"></div>
        </div>

        {/* Segmented overlay */}
        {segmented && (
          <div className="mc-progress__segments">
            {Array.from({ length: segments }).map((_, i) => (
              <span
                key={i}
                className={`
                  mc-progress__segment
                  ${i < filledSegments ? 'mc-progress__segment--filled' : ''}
                `}
              ></span>
            ))}
          </div>
        )}

        {/* Value display for health/hunger */}
        {(type === 'health' || type === 'hunger') && showLabel && (
          <div className="mc-progress__value">
            {value} / {max}
          </div>
        )}
      </div>
    </div>
  );
};

export default MCProgressBar;
