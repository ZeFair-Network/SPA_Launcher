import React from 'react';

interface Props {
  percent: number;
  status: string;
}

export default function ProgressBar({ percent, status }: Props) {
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="progress-text">{status}</div>
    </div>
  );
}
