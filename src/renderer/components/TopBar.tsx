import React from 'react';
import { type BiomeType, BIOME_META } from './BiomeThemeSwitcher';

interface Props {
  currentBiome: BiomeType;
  onlineCount?: number;
}

export default function TopBar({ currentBiome, onlineCount = 0 }: Props) {
  const meta = BIOME_META[currentBiome];

  return (
    <div className="top-bar">
      <div className="top-bar__biome">
        <span className="top-bar__biome-icon">{meta.icon}</span>
        <span className="top-bar__biome-text">
          Биом: <strong>{meta.biome}</strong>
        </span>
        <span className="top-bar__sep">·</span>
        <span className="top-bar__time">{meta.time}</span>
        <span className="top-bar__sep">·</span>
        <span className="top-bar__temp">{meta.temp}</span>
      </div>

      {onlineCount > 0 && (
        <div className="top-bar__right">
          <div className="top-bar__online">
            <span className="top-bar__online-dot" />
            <span>Online: {onlineCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}
