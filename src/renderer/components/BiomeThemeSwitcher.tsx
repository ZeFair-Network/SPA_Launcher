/**
 * BiomeThemeSwitcher - Theme switcher
 * Switches between biome themes
 */

import React from 'react';
import './BiomeThemeSwitcher.css';

export type BiomeType = 'default' | 'summer' | 'cherry-blossom';

interface Biome {
  id: BiomeType;
  name: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const BIOMES: Biome[] = [
  {
    id: 'default',
    name: 'Default',
    label: 'Default',
    icon: '🔵',
    color: '#3b82f6',
    description: 'Dark with blue accent',
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    label: 'Spring',
    icon: '🌸',
    color: '#f43f5e',
    description: 'Sakura spring dawn',
  },
  {
    id: 'summer',
    name: 'Summer Meadow',
    label: 'Summer',
    icon: '☀️',
    color: '#10b981',
    description: 'Sunlit meadow',
  },
];

export const BIOME_META: Record<BiomeType, { biome: string; time: string; temp: string; icon: string }> = {
  'default':        { biome: 'Default',        time: 'Ночь',    temp: '−5°C',  icon: '🔵' },
  'cherry-blossom': { biome: 'Cherry Blossom', time: 'Рассвет', temp: '+18°C', icon: '🌸' },
  'summer':         { biome: 'Summer Meadow',  time: 'День',    temp: '+24°C', icon: '☀️' },
};

interface Props {
  currentBiome: BiomeType;
  onBiomeChange: (biome: BiomeType) => void;
}

const BiomeThemeSwitcher: React.FC<Props> = ({ currentBiome, onBiomeChange }) => {
  const switchBiome = (newBiome: BiomeType) => {
    if (newBiome === currentBiome) return;
    document.documentElement.setAttribute('data-biome', newBiome);
    localStorage.setItem('spa-launcher-biome', newBiome);
    onBiomeChange(newBiome);
  };

  return (
    <div className="biome-switcher-inline">
      {BIOMES.map(biome => (
        <button
          key={biome.id}
          className={`biome-tab ${currentBiome === biome.id ? 'biome-tab--active' : ''}`}
          onClick={() => switchBiome(biome.id)}
          style={{ '--biome-color': biome.color } as React.CSSProperties}
          title={biome.description}
        >
          <span className="biome-tab__icon">{biome.icon}</span>
          <span className="biome-tab__label">{biome.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BiomeThemeSwitcher;
